import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type FalImageResult = {
  image?: {
    url?: string;
  };
  url?: string;
  error?: unknown;
  detail?: unknown;
  message?: unknown;
};

type ReplicatePrediction = {
  id?: string;
  status?: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: unknown;
  error?: unknown;
  urls?: {
    get?: string;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { imageDataUrl } = await request.json() as { imageDataUrl?: string };

    if (!imageDataUrl?.startsWith("data:image/")) {
      return json({ error: "A data URL image is required." }, 400);
    }

    const falKey = Deno.env.get("FAL_KEY");

    if (falKey) {
      const url = await removeBackgroundWithFal(imageDataUrl, falKey);
      return json({ url, provider: "fal" });
    }

    const replicateToken = Deno.env.get("REPLICATE_API_TOKEN");

    if (replicateToken) {
      const url = await removeBackgroundWithReplicate(imageDataUrl, replicateToken);
      return json({ url, provider: "replicate" });
    }

    return json({ error: "Configure FAL_KEY or REPLICATE_API_TOKEN for subject matte generation." }, 501);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Subject matte generation failed." }, 500);
  }
});

async function removeBackgroundWithFal(imageDataUrl: string, key: string) {
  const briaEndpoint = "fal-ai/bria/background/remove";
  const rembgEndpoint = "fal-ai/imageutils/rembg";

  try {
    return await callFalRemoveBackgroundEndpoint(briaEndpoint, imageDataUrl, key);
  } catch (briaError) {
    console.warn("fal Bria background removal failed; retrying with imageutils/rembg.", briaError);

    try {
      return await callFalRemoveBackgroundEndpoint(rembgEndpoint, imageDataUrl, key);
    } catch (rembgError) {
      throw new Error(
        `fal subject matte generation failed. Bria: ${getErrorMessage(briaError)} Rembg: ${getErrorMessage(rembgError)}`,
      );
    }
  }
}

async function callFalRemoveBackgroundEndpoint(endpointId: string, imageDataUrl: string, key: string) {
  const response = await fetch(`https://fal.run/${endpointId}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: imageDataUrl,
      sync_mode: true,
    }),
  });
  const payload = await response.json().catch(() => ({})) as FalImageResult;

  if (!response.ok) {
    throw new Error(getFalError(payload) || `${endpointId} failed with HTTP ${response.status}.`);
  }

  const url = payload.image?.url ?? payload.url;

  if (!url) {
    throw new Error(`${endpointId} did not return a subject matte URL.`);
  }

  return url;
}

function getFalError(payload: FalImageResult) {
  for (const value of [payload.error, payload.detail, payload.message]) {
    if (typeof value === "string") {
      return value;
    }

    if (value && typeof value === "object") {
      return JSON.stringify(value);
    }
  }

  return null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function removeBackgroundWithReplicate(imageDataUrl: string, token: string) {
  const response = await fetch("https://api.replicate.com/v1/models/bria/remove-background/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait=20",
    },
    body: JSON.stringify({
      input: {
        image: imageDataUrl,
        preserve_partial_alpha: true,
      },
    }),
  });
  const created = await response.json().catch(() => ({})) as ReplicatePrediction;

  if (!response.ok) {
    throw new Error(getReplicateError(created) || `Replicate subject matte generation failed with HTTP ${response.status}.`);
  }

  const finished = created.status === "succeeded" || created.status === "failed" || created.status === "canceled"
    ? created
    : await pollReplicatePrediction(created.urls?.get, token);

  if (finished.status !== "succeeded") {
    throw new Error(getReplicateError(finished) || `Replicate subject matte generation ended with status ${finished.status ?? "unknown"}.`);
  }

  const url = getReplicateOutputUrl(finished.output);

  if (!url) {
    throw new Error("Replicate did not return a subject matte URL.");
  }

  return url;
}

async function pollReplicatePrediction(url: string | undefined, token: string) {
  if (!url) {
    throw new Error("Replicate did not return a prediction polling URL.");
  }

  for (let attempt = 0; attempt < 24; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1250));

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const prediction = await response.json().catch(() => ({})) as ReplicatePrediction;

    if (!response.ok) {
      throw new Error(getReplicateError(prediction) || `Replicate polling failed with HTTP ${response.status}.`);
    }

    if (prediction.status === "succeeded" || prediction.status === "failed" || prediction.status === "canceled") {
      return prediction;
    }
  }

  throw new Error("Replicate subject matte generation timed out.");
}

function getReplicateOutputUrl(output: unknown): string | null {
  if (typeof output === "string") {
    return output;
  }

  if (Array.isArray(output)) {
    const firstUrl = output.find((value) => typeof value === "string");
    return typeof firstUrl === "string" ? firstUrl : null;
  }

  if (output && typeof output === "object") {
    const candidate = output as { image?: unknown; url?: unknown; output?: unknown };

    if (typeof candidate.image === "string") {
      return candidate.image;
    }

    if (typeof candidate.url === "string") {
      return candidate.url;
    }

    return getReplicateOutputUrl(candidate.output);
  }

  return null;
}

function getReplicateError(prediction: ReplicatePrediction) {
  if (typeof prediction.error === "string") {
    return prediction.error;
  }

  if (prediction.error && typeof prediction.error === "object") {
    return JSON.stringify(prediction.error);
  }

  return null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
