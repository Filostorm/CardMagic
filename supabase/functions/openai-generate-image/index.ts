import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ImageGenerationOptions = {
  size?: "1024x1024" | "1536x1024" | "1024x1536";
  quality?: "medium" | "high";
};

const OPENAI_IMAGE_MODELS = ["gpt-image-1.5", "gpt-image-1"] as const;
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
    const { prompt, options } = await request.json() as {
      prompt?: string;
      options?: ImageGenerationOptions;
    };

    if (!prompt?.trim()) {
      return json({ error: "Prompt is required." }, 400);
    }

    const result = await generateImage(prompt, {
      size: options?.size ?? "1024x1024",
      quality: options?.quality ?? "medium",
    });

    return json(result);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "OpenAI image generation failed." }, 500);
  }
});

async function generateImage(prompt: string, options: Required<ImageGenerationOptions>) {
  let lastError: Error | null = null;

  for (const model of OPENAI_IMAGE_MODELS) {
    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          size: options.size,
          quality: options.quality,
          output_format: "png",
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error?.message || `OpenAI image generation failed with HTTP ${response.status}.`);
      }

      const image = payload?.data?.[0];

      if (image?.b64_json) {
        return { b64Json: image.b64_json };
      }

      if (image?.url) {
        return { url: image.url };
      }

      throw new Error("OpenAI did not return image data.");
    } catch (error) {
      const generationError = error instanceof Error ? error : new Error("OpenAI image generation failed.");
      lastError = generationError;

      if (!shouldTryNextOpenAiModel(generationError)) {
        throw generationError;
      }
    }
  }

  throw lastError ?? new Error("OpenAI image generation failed.");
}

function shouldTryNextOpenAiModel(error: Error) {
  return /\b(?:model|unsupported|not supported|not found|does not exist|access|permission|available)\b/i.test(
    error.message,
  );
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

