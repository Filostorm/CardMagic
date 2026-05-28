import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ImageEditSize = "1024x1024" | "1536x1024" | "1024x1536";

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
    const { imageDataUrl, prompt, size } = await request.json() as {
      imageDataUrl?: string;
      prompt?: string;
      size?: ImageEditSize;
    };

    if (!imageDataUrl?.startsWith("data:image/")) {
      return json({ error: "A data URL image is required." }, 400);
    }

    if (!prompt?.trim()) {
      return json({ error: "Prompt is required." }, 400);
    }

    const result = await editImage({
      imageFile: dataUrlToFile(imageDataUrl, "card-art.png"),
      prompt,
      size: size ?? "1024x1024",
    });

    return json(result);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "OpenAI image edit failed." }, 500);
  }
});

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

