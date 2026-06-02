import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import {
  AiCreditSpendError,
  refundAiCreditSpend,
  spendAiCredits,
  type AiCreditSpendCategory,
} from "../_shared/ai-credits.ts";

type ImageGenerationOptions = {
  size?: "1024x1024" | "1536x1024" | "1024x1536";
  quality?: "medium" | "high";
};

const OPENAI_IMAGE_MODELS = ["gpt-image-1.5", "gpt-image-1"] as const;
const MAX_JSON_BODY_BYTES = 64 * 1024;
const MAX_PROMPT_LENGTH = 4000;
const IMAGE_SIZES = new Set(["1024x1024", "1536x1024", "1024x1536"]);
const IMAGE_QUALITIES = new Set(["medium", "high"]);
const IMAGE_SPEND_CATEGORIES = new Set<AiCreditSpendCategory>(["artImage", "artImageHigh", "setIcon"]);
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cardmagic-request-id",
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
    const user = await getAuthenticatedUser(request.headers.get("Authorization"));

    if (!user) {
      return json({ error: "Sign in before generating images." }, 401);
    }

    const { prompt, options, spendCategory: requestedSpendCategory, clientRequestId } = await readJsonBody<{
      prompt?: string;
      options?: ImageGenerationOptions;
      spendCategory?: AiCreditSpendCategory;
      clientRequestId?: string;
    }>(request, MAX_JSON_BODY_BYTES);
    const normalizedPrompt = prompt?.trim() ?? "";

    if (!normalizedPrompt) {
      return json({ error: "Prompt is required." }, 400);
    }

    if (normalizedPrompt.length > MAX_PROMPT_LENGTH) {
      return json({ error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.` }, 400);
    }

    if (options?.size && !IMAGE_SIZES.has(options.size)) {
      return json({ error: "Unsupported image size." }, 400);
    }

    if (options?.quality && !IMAGE_QUALITIES.has(options.quality)) {
      return json({ error: "Unsupported image quality." }, 400);
    }

    const normalizedOptions: Required<ImageGenerationOptions> = {
      size: options?.size ?? "1024x1024",
      quality: options?.quality ?? "medium",
    };
    const spendCategory = resolveImageSpendCategory(normalizedOptions.quality, requestedSpendCategory);

    if (!spendCategory) {
      return json({ error: "Unsupported AI credit spend category." }, 400);
    }

    if (spendCategory === "artImage" && normalizedOptions.quality === "high") {
      return json({ error: "High-quality image generation must use the high-quality credit category." }, 400);
    }

    if (
      spendCategory === "setIcon" &&
      (normalizedOptions.size !== "1024x1024" || normalizedOptions.quality !== "medium")
    ) {
      return json({ error: "Set-symbol generation must use square medium image options." }, 400);
    }

    const supabaseUrl = requireEnv("SUPABASE_URL").replace(/\/$/, "");
    const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const spend = await spendAiCredits({
      supabaseUrl,
      supabaseAnonKey,
      accessToken: user.accessToken,
      category: spendCategory,
      source: "openai-generate-image",
      referenceId: createAiSpendReferenceId("openai-generate-image", clientRequestId),
      metadata: {
        size: normalizedOptions.size,
        quality: normalizedOptions.quality,
      },
    });

    try {
      const result = await generateImage(normalizedPrompt, normalizedOptions);

      return json({ ...result, progress: spend.progress, creditSpend: spend });
    } catch (providerError) {
      await refundAiCreditSpend({
        supabaseUrl,
        serviceRoleKey,
        userId: user.id,
        spend,
        reason: providerError instanceof Error ? providerError.message : "OpenAI image generation failed.",
      }).catch((refundError) => {
        console.warn("Unable to refund failed OpenAI image generation.", refundError);
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

    return json({ error: error instanceof Error ? error.message : "OpenAI image generation failed." }, 500);
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

function resolveImageSpendCategory(
  quality: Required<ImageGenerationOptions>["quality"],
  requestedCategory?: AiCreditSpendCategory,
) {
  if (!requestedCategory) {
    return quality === "high" ? "artImageHigh" : "artImage";
  }

  return IMAGE_SPEND_CATEGORIES.has(requestedCategory) ? requestedCategory : null;
}

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

function createAiSpendReferenceId(source: string, clientRequestId: unknown) {
  if (typeof clientRequestId !== "string") {
    return undefined;
  }

  const normalizedRequestId = clientRequestId.trim().slice(0, 96).replace(/[^a-z0-9._:-]+/gi, "-");

  return normalizedRequestId ? `${source}:${normalizedRequestId}` : undefined;
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
