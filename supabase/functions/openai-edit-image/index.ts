import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import {
  AiCreditSpendError,
  refundAiCreditSpend,
  spendAiCredits,
  type AiCreditSpendCategory,
} from "../_shared/ai-credits.ts";

type ImageEditSize = "1024x1024" | "1536x1024" | "1024x1536";

const OPENAI_IMAGE_MODELS = ["gpt-image-2", "gpt-image-1.5", "gpt-image-1"] as const;
const MAX_JSON_BODY_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_DATA_URL_CHARS = 10 * 1024 * 1024;
const MAX_PROMPT_LENGTH = 4000;
const IMAGE_SIZES = new Set(["1024x1024", "1536x1024", "1024x1536"]);
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
      return json({ error: "Sign in before editing images." }, 401);
    }

    const { imageDataUrl, prompt, size, clientRequestId } = await readJsonBody<{
      imageDataUrl?: string;
      prompt?: string;
      size?: ImageEditSize;
      spendCategory?: AiCreditSpendCategory;
      clientRequestId?: string;
    }>(request, MAX_JSON_BODY_BYTES);
    const normalizedPrompt = prompt?.trim() ?? "";

    if (!imageDataUrl?.startsWith("data:image/")) {
      return json({ error: "A data URL image is required." }, 400);
    }

    if (imageDataUrl.length > MAX_IMAGE_DATA_URL_CHARS) {
      return json({ error: "Image is too large for AI editing." }, 413);
    }

    if (!normalizedPrompt) {
      return json({ error: "Prompt is required." }, 400);
    }

    if (normalizedPrompt.length > MAX_PROMPT_LENGTH) {
      return json({ error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.` }, 400);
    }

    if (size && !IMAGE_SIZES.has(size)) {
      return json({ error: "Unsupported image size." }, 400);
    }

    const supabaseUrl = requireEnv("SUPABASE_URL").replace(/\/$/, "");
    const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const spend = await spendAiCredits({
      supabaseUrl,
      supabaseAnonKey,
      accessToken: user.accessToken,
      category: "artImage",
      source: "openai-edit-image",
      referenceId: createAiSpendReferenceId("openai-edit-image", clientRequestId),
      metadata: {
        size: size ?? "1024x1024",
      },
    });

    try {
      const result = await editImage({
        imageFile: dataUrlToFile(imageDataUrl, "card-art.png"),
        prompt: normalizedPrompt,
        size: size ?? "1024x1024",
      });

      return json({ ...result, progress: spend.progress, creditSpend: spend });
    } catch (providerError) {
      await refundAiCreditSpend({
        supabaseUrl,
        serviceRoleKey,
        userId: user.id,
        spend,
        reason: providerError instanceof Error ? providerError.message : "OpenAI image edit failed.",
      }).catch((refundError) => {
        console.warn("Unable to refund failed OpenAI image edit.", refundError);
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

    return json({ error: error instanceof Error ? error.message : "OpenAI image edit failed." }, 500);
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

async function editImage({
  imageFile,
  prompt,
  size,
}: {
  imageFile: File;
  prompt: string;
  size: ImageEditSize;
}) {
  let lastError: Error | null = null;

  for (const model of OPENAI_IMAGE_MODELS) {
    try {
      const formData = new FormData();

      formData.append("model", model);
      formData.append("prompt", prompt);
      formData.append("size", size);
      formData.append("quality", "medium");
      formData.append("output_format", "png");
      formData.append("image", imageFile);

      const response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`,
        },
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error?.message || `OpenAI image edit failed with HTTP ${response.status}.`);
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
      const editError = error instanceof Error ? error : new Error("OpenAI image edit failed.");
      lastError = editError;

      if (!shouldTryNextOpenAiModel(editError)) {
        throw editError;
      }
    }
  }

  throw lastError ?? new Error("OpenAI image edit failed.");
}

function dataUrlToFile(dataUrl: string, filename: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid image data URL.");
  }

  const mimeType = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], filename, { type: mimeType });
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
