import { Platform } from "react-native";

import { supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";

export type AiImageGenerationOptions = {
  size: "1024x1024" | "1536x1024" | "1024x1536";
  quality: "medium" | "high";
};

export type AiImageResult = {
  b64Json?: string;
  url?: string;
};

type AiImageFunctionResponse = AiImageResult & {
  error?: string;
};

type AiRulesTextFunctionResponse = {
  content?: string;
  error?: string;
};

type SubjectMatteFunctionResponse = AiImageResult & {
  provider?: "fal" | "replicate";
  error?: string;
};

export async function generateAiImageViaEdge({
  prompt,
  options,
}: {
  prompt: string;
  options: AiImageGenerationOptions;
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.functions.invoke<AiImageFunctionResponse>("openai-generate-image", {
    body: { prompt, options },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.b64Json || data?.url) {
    return data;
  }

  throw new Error(data?.error ?? "OpenAI did not return image data.");
}

export async function generateAiImageEditViaEdge({
  imageUri,
  prompt,
  size,
}: {
  imageUri: string;
  prompt: string;
  size: AiImageGenerationOptions["size"];
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const imageDataUrl = await imageUriToDataUrl(imageUri);
  const { data, error } = await supabase.functions.invoke<AiImageFunctionResponse>("openai-edit-image", {
    body: { imageDataUrl, prompt, size },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.b64Json || data?.url) {
    return data;
  }

  throw new Error(data?.error ?? "OpenAI did not return edited image data.");
}

export async function generateAiSubjectMaskViaEdge(args: {
  imageUri: string;
  prompt: string;
  size: AiImageGenerationOptions["size"];
}) {
  return generateAiImageEditViaEdge(args);
}

export async function generateSubjectMatteViaEdge({
  imageUri,
}: {
  imageUri: string;
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const imageDataUrl = await imageUriToDataUrl(imageUri);
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/functions/v1/generate-subject-matte`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${supabaseAnonKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ imageDataUrl }),
  });
  const data = await response.json().catch(() => null) as SubjectMatteFunctionResponse | null;

  if (!response.ok) {
    throw new Error(data?.error ?? `Subject matte provider failed with HTTP ${response.status}.`);
  }

  if (data?.b64Json || data?.url) {
    return data;
  }

  throw new Error(data?.error ?? "Subject matte provider did not return image data.");
}

export async function fixRulesTextViaEdge(prompt: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.functions.invoke<AiRulesTextFunctionResponse>("openai-fix-rules-text", {
    body: { prompt },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.content) {
    return data.content;
  }

  throw new Error(data?.error ?? "OpenAI did not return fixed rules text.");
}

async function imageUriToDataUrl(uri: string) {
  if (uri.startsWith("data:")) {
    return uri;
  }

  if (Platform.OS !== "web" && uri.startsWith("file://")) {
    const FileSystem = await import("expo-file-system");
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });

    return `data:image/${getImageUriExtension(uri, "png") === "jpg" ? "jpeg" : getImageUriExtension(uri, "png")};base64,${base64}`;
  }

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(`Image fetch failed with ${response.status}.`);
  }

  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  const mimeType = blob.type || `image/${getImageUriExtension(uri, "png")}`;

  return `data:${mimeType};base64,${base64}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
}

function getImageUriExtension(uri: string, fallback: string) {
  return uri.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/)?.[1]?.toLowerCase() ?? fallback;
}
