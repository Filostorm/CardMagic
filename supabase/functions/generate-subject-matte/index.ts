import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import {
  AiCreditSpendError,
  refundAiCreditSpend,
  spendAiCredits,
} from "../_shared/ai-credits.ts";

type MaskEntry = {
  url?: string;
  image?: { url?: string };
  mask?: { url?: string };
};

type FalImageResult = {
  data?: unknown;
  output?: unknown;
  result?: unknown;
  image?: {
    url?: string;
  };
  masks?: MaskEntry[];
  individual_masks?: MaskEntry[];
  combined_mask?: string | { url?: string };
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

class FalNoMaskUrlError extends Error {
  readonly summary: unknown;

  constructor(message: string, summary: unknown) {
    super(message);
    this.name = "FalNoMaskUrlError";
    this.summary = summary;
  }
}

class FalRequestTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FalRequestTimeoutError";
  }
}

type FalSamAttemptFailure = {
  endpointId: string;
  applyMask: boolean;
  error: string;
  summary?: unknown;
};

type FalSamDiagnosticAttempt = FalSamAttemptFailure & {
  status: "failed" | "success";
};

type FalSamDiagnostics = {
  targetPrompt: string;
  provider: "fal-sam";
  attempts: FalSamDiagnosticAttempt[];
};

class FalSamSegmentationError extends Error {
  readonly diagnostics: FalSamDiagnostics;

  constructor(message: string, diagnostics: FalSamDiagnostics) {
    super(message);
    this.name = "FalSamSegmentationError";
    this.diagnostics = diagnostics;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cardmagic-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FAL_SAM_FETCH_TIMEOUT_MS = 18000;
const MAX_JSON_BODY_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_DATA_URL_CHARS = 10 * 1024 * 1024;
const MAX_TARGET_PROMPT_LENGTH = 160;

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const user = await getAuthenticatedUser(request.headers.get("Authorization"));

    if (!user) {
      return json({ error: "Sign in before generating subject masks." }, 401);
    }

    const { imageDataUrl, targetPrompt, clientRequestId } = await readJsonBody<{
      imageDataUrl?: string;
      targetPrompt?: string;
      clientRequestId?: string;
    }>(request, MAX_JSON_BODY_BYTES);

    if (!imageDataUrl?.startsWith("data:image/")) {
      return json({ error: "A data URL image is required." }, 400);
    }

    if (imageDataUrl.length > MAX_IMAGE_DATA_URL_CHARS) {
      return json({ error: "Image is too large for subject masking." }, 413);
    }

    const normalizedTargetPrompt =
      typeof targetPrompt === "string" ? targetPrompt.trim().slice(0, MAX_TARGET_PROMPT_LENGTH) : "";
    console.log("[subject-matte] request received", {
      hasImage: imageDataUrl.startsWith("data:image/"),
      targetPrompt: normalizedTargetPrompt || "(foreground)",
    });

    const supabaseUrl = requireEnv("SUPABASE_URL").replace(/\/$/, "");
    const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const spend = await spendAiCredits({
      supabaseUrl,
      supabaseAnonKey,
      accessToken: user.accessToken,
      category: "subjectMask",
      source: "generate-subject-matte",
      referenceId: createAiSpendReferenceId("generate-subject-matte", clientRequestId),
      metadata: {
        prompted: Boolean(normalizedTargetPrompt),
      },
    });

    try {
      const falKey = Deno.env.get("FAL_KEY");

      if (falKey) {
        if (normalizedTargetPrompt) {
          const result = await segmentImageWithFalSam(imageDataUrl, normalizedTargetPrompt, falKey);
          return json({
            url: result.subjectMasks[0]?.url,
            urls: result.subjectMasks.map((mask) => mask.url),
            subjectMasks: result.subjectMasks,
            provider: "fal-sam",
            targetPrompt: normalizedTargetPrompt,
            diagnostics: result.diagnostics,
            progress: spend.progress,
            creditSpend: spend,
          });
        }

        const url = await removeBackgroundWithFal(imageDataUrl, falKey);
        return json({ url, provider: "fal", progress: spend.progress, creditSpend: spend });
      }

      if (normalizedTargetPrompt) {
        throw new RequestValidationError("Configure FAL_KEY for prompted subject segmentation.", 501);
      }

      const replicateToken = Deno.env.get("REPLICATE_API_TOKEN");

      if (replicateToken) {
        const url = await removeBackgroundWithReplicate(imageDataUrl, replicateToken);
        return json({ url, provider: "replicate", progress: spend.progress, creditSpend: spend });
      }

      throw new RequestValidationError("Configure FAL_KEY or REPLICATE_API_TOKEN for subject matte generation.", 501);
    } catch (providerError) {
      await refundAiCreditSpend({
        supabaseUrl,
        serviceRoleKey,
        userId: user.id,
        spend,
        reason: providerError instanceof Error ? providerError.message : "Subject matte generation failed.",
      }).catch((refundError) => {
        console.warn("Unable to refund failed subject matte generation.", refundError);
      });

      throw providerError;
    }
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return json({ error: error.message }, error.status);
    }

    if (error instanceof AiCreditSpendError) {
      return json({ error: error.message }, error.status);
    }

    if (error instanceof FalSamSegmentationError) {
      return json({ error: error.message, diagnostics: error.diagnostics }, 500);
    }

    return json({ error: error instanceof Error ? error.message : "Subject matte generation failed." }, 500);
  }
});

type SupabaseAuthUser = {
  id: string;
  accessToken: string;
};

class RequestValidationError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RequestValidationError";
    this.status = status;
  }
}

async function getAuthenticatedUser(authorization: string | null): Promise<SupabaseAuthUser | null> {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const supabaseUrl = requireEnv("SUPABASE_URL").replace(/\/$/, "");
  const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
  const token = authorization.slice("Bearer ".length);
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
    },
  });

  if (!userResponse.ok) {
    return null;
  }

  const user = await userResponse.json();
  return typeof user?.id === "string" ? { id: user.id, accessToken: token } : null;
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

async function readJsonBody<T>(request: Request, maxBytes: number): Promise<T> {
  const contentLength = Number(request.headers.get("Content-Length") ?? "0");

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new RequestValidationError("Request body is too large.", 413);
  }

  const body = await request.text();

  if (body.length > maxBytes) {
    throw new RequestValidationError("Request body is too large.", 413);
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new RequestValidationError("Request body must be valid JSON.", 400);
  }
}

async function segmentImageWithFalSam(imageDataUrl: string, targetPrompt: string, key: string) {
  const startedAt = Date.now();
  // Mirror the background-removal path: a synchronous fal.run call that returns a
  // prompted-subject cutout (apply_mask) — same shape as normal masking.
  //
  // SAM-3 concept segmentation matches a SINGLE concept per call, so compound
  // prompts like "bow and arrow" are less reliable than separate "bow" and
  // "arrow" calls. Split simple conjunctions and let the client union cutouts.
  const endpointId = "fal-ai/sam-3-1/image";
  const concepts = getTargetConcepts(targetPrompt);
  const conceptList = concepts.length > 0 ? concepts : [targetPrompt.trim()];
  const attempts: FalSamDiagnosticAttempt[] = [];
  const subjectMasks: { concept: string; url: string }[] = [];

  // Parallel: wall-clock collapses to the slowest single SAM inference instead of
  // the sum. Safe because the client sends a downscaled image (small body), so
  // concurrent uploads no longer trip the HTTP/2 stream error; fetchWithRetry
  // covers any residual transport blip.
  const settled = await Promise.allSettled(
    conceptList.map((concept) => callFalSamSyncEndpoint(endpointId, imageDataUrl, concept, key)),
  );

  settled.forEach((outcome, index) => {
    const concept = conceptList[index];
    const label = conceptList.length > 1 ? `${endpointId} ["${concept}"]` : endpointId;

    if (outcome.status === "fulfilled") {
      subjectMasks.push({ concept, url: outcome.value });
      attempts.push(getFalSamSuccess(label, true));
    } else {
      attempts.push(getFalSamAttemptFailure(label, true, outcome.reason));
      console.warn(`fal SAM concept "${concept}" failed.`, getErrorMessage(outcome.reason));
    }
  });

  if (subjectMasks.length > 0) {
    console.log("[subject-matte] fal SAM segmentation completed", {
      targetPrompt,
      conceptCount: conceptList.length,
      matchedCount: subjectMasks.length,
      durationMs: Date.now() - startedAt,
    });
    return { subjectMasks, diagnostics: getFalSamDiagnostics(targetPrompt, attempts) };
  }

  console.warn("fal SAM prompted segmentation failed.", {
    targetPrompt,
    durationMs: Date.now() - startedAt,
    attempts,
  });
  const diagnostics = getFalSamDiagnostics(targetPrompt, attempts);
  throw new FalSamSegmentationError(
    getFalSamUserMessage(conceptList),
    diagnostics,
  );
}

function getTargetConcepts(targetPrompt: string) {
  const MAX_CONCEPTS = 4;
  const concepts = targetPrompt
    .replace(/\s*&\s*/g, ",")
    .split(/[,;]+|\s+(?:and|plus|with)\s+/i)
    .map((concept) => concept.replace(/^(?:a|an|the)\s+/i, "").trim())
    .filter(Boolean)
    .slice(0, MAX_CONCEPTS);

  return Array.from(new Set(concepts));
}

function getFalSamUserMessage(concepts: string[]) {
  const label = concepts.filter(Boolean).join(", ");

  return label
    ? `I couldn't isolate ${concepts.length > 1 ? `those subjects (${label})` : `“${label}”`} in this art. Try one simpler visible object, like “arrow”, “bow”, “face”, or “wolf”.`
    : "I couldn't isolate that subject in this art. Try one simple visible object, or use manual mask editing.";
}

function getFalSamAttemptFailure(endpointId: string, applyMask: boolean, error: unknown): FalSamDiagnosticAttempt {
  return {
    endpointId,
    applyMask,
    status: "failed",
    error: getErrorMessage(error),
    summary: error instanceof FalNoMaskUrlError ? error.summary : undefined,
  };
}

function getFalSamSuccess(endpointId: string, applyMask: boolean): FalSamDiagnosticAttempt {
  return {
    endpointId,
    applyMask,
    status: "success",
    error: "",
  };
}

function getFalSamDiagnostics(targetPrompt: string, attempts: FalSamDiagnosticAttempt[]): FalSamDiagnostics {
  return {
    targetPrompt,
    provider: "fal-sam",
    attempts,
  };
}

// Retries transient transport failures (e.g. Deno HTTP/2 "unspecific protocol
// error" while uploading a large body). Only network-level throws are retried —
// an HTTP error response is returned as-is for the caller to handle.
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 2,
  timeoutMs = FAL_SAM_FETCH_TIMEOUT_MS,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      lastError = error;
      if (controller.signal.aborted) {
        throw new FalRequestTimeoutError(`fal request timed out after ${Math.round(timeoutMs / 1000)}s.`);
      }

      console.warn(`[subject-matte] transport error (attempt ${attempt + 1}/${attempts})`, getErrorMessage(error));
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function callFalSamSyncEndpoint(
  endpointId: string,
  imageDataUrl: string,
  targetPrompt: string,
  key: string,
) {
  const startedAt = Date.now();
  console.log("[subject-matte] calling fal", { endpointId, targetPrompt, timeoutMs: FAL_SAM_FETCH_TIMEOUT_MS });
  const body = JSON.stringify({
    image_url: imageDataUrl,
    prompt: targetPrompt,
    apply_mask: true,
    output_format: "png",
    sync_mode: true,
    // Required for text/concept segmentation to actually emit masks; without
    // it SAM-3.1 returns an empty masks array for valid prompts.
    return_multiple_masks: true,
    // 1 keeps the (sync_mode, base64-inlined) response small — multiple large
    // masks contributed to the edge function hitting its memory limit.
    max_masks: 1,
  });
  // Deno's HTTP/2 client intermittently aborts the large inline-image upload
  // with "unspecific protocol error". Retry the transient transport failure.
  const response = await fetchWithRetry(`https://fal.run/${endpointId}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body,
  }, 2, FAL_SAM_FETCH_TIMEOUT_MS);
  const payload = await response.json().catch(() => ({})) as FalImageResult;
  console.log("[subject-matte] fal responded", {
    endpointId,
    targetPrompt,
    status: response.status,
    ok: response.ok,
    durationMs: Date.now() - startedAt,
    summary: summarizeFalPayload(payload),
  });

  if (!response.ok) {
    throw new Error(getFalError(payload) || `${endpointId} failed with HTTP ${response.status}.`);
  }

  // Prefer the apply_mask cutout (image) so the result matches normal background
  // removal; fall back to the first raw mask.
  const cutoutUrl = isImageUrl(payload.image?.url) ? payload.image?.url ?? null : null;
  const url = cutoutUrl ?? getFalImageResultUrl(payload);

  if (!url) {
    const summary = summarizeFalPayload(payload);
    console.warn(`${endpointId} response did not contain a readable mask URL.`, { targetPrompt, summary });
    const foundNothing = !(payload.masks?.length) && !isImageUrl(payload.image?.url);
    throw new FalNoMaskUrlError(
      foundNothing
        ? `Couldn't find “${targetPrompt}” in this art.`
        : `${endpointId} did not return a segmented mask URL.`,
      summary,
    );
  }

  console.log("[subject-matte] resolved mask url", { endpointId, urlPrefix: url.slice(0, 64) });
  return url;
}

function getFalImageResultUrl(payload: unknown): string | null {
  if (typeof payload === "string") {
    return isImageUrl(payload) ? payload : null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const url = getFalImageResultUrl(item);

      if (url) {
        return url;
      }
    }

    return null;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const result = payload as FalImageResult;

  // Mask arrays: each entry may expose the URL directly, or nested under
  // image/mask (schema varies across SAM endpoints).
  for (const maskList of [result.masks, result.individual_masks]) {
    const maskUrl = findMaskEntryUrl(maskList);

    if (maskUrl) {
      return maskUrl;
    }
  }

  // combined_mask may be a bare URL string or an { url } object.
  if (isImageUrl(result.combined_mask)) {
    return result.combined_mask;
  }

  if (
    result.combined_mask &&
    typeof result.combined_mask === "object" &&
    isImageUrl(result.combined_mask.url)
  ) {
    return result.combined_mask.url;
  }

  for (const candidate of [result.image?.url, result.url]) {
    if (isImageUrl(candidate)) {
      return candidate;
    }
  }

  for (const nested of [result.data, result.output, result.result]) {
    const url = getFalImageResultUrl(nested);

    if (url) {
      return url;
    }
  }

  return null;
}

function findMaskEntryUrl(masks: MaskEntry[] | undefined): string | null {
  if (!Array.isArray(masks)) {
    return null;
  }

  for (const mask of masks) {
    if (!mask || typeof mask !== "object") {
      continue;
    }

    for (const candidate of [mask.url, mask.image?.url, mask.mask?.url]) {
      if (isImageUrl(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function isImageUrl(value: unknown): value is string {
  return typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:image/"));
}

function summarizeFalPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { type: typeof payload };
  }

  const record = payload as Record<string, unknown>;
  return {
    keys: Object.keys(record),
    masksLength: Array.isArray(record.masks) ? record.masks.length : undefined,
    individualMasksLength: Array.isArray(record.individual_masks) ? record.individual_masks.length : undefined,
    combinedMaskType: Array.isArray(record.combined_mask) ? "array" : typeof record.combined_mask,
    firstMaskKeys: Array.isArray(record.masks) && record.masks[0] && typeof record.masks[0] === "object"
      ? Object.keys(record.masks[0] as Record<string, unknown>)
      : undefined,
    imageKeys: record.image && typeof record.image === "object" ? Object.keys(record.image as Record<string, unknown>) : undefined,
    dataKeys: record.data && typeof record.data === "object" ? Object.keys(record.data as Record<string, unknown>) : undefined,
    outputType: Array.isArray(record.output) ? "array" : typeof record.output,
    resultKeys: record.result && typeof record.result === "object" ? Object.keys(record.result as Record<string, unknown>) : undefined,
  };
}

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

function createAiSpendReferenceId(source: string, clientRequestId: unknown) {
  if (typeof clientRequestId !== "string") {
    return undefined;
  }

  const normalizedRequestId = clientRequestId.trim().slice(0, 96).replace(/[^a-z0-9._:-]+/gi, "-");

  return normalizedRequestId ? `${source}:${normalizedRequestId}` : undefined;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
