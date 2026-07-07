import { Platform } from "react-native";

import type { CreditSpendCategory } from "@/lib/progression";
import { supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";

export type AiImageGenerationOptions = {
  size: "1024x1024" | "1536x1024" | "1024x1536";
  quality: "medium" | "high";
};

export type AiImageResult = {
  b64Json?: string;
  url?: string;
  providerModel?: string;
  fallbackAttempts?: { model: string; error: string }[];
};

export type AiCreditSpendReceipt = {
  transactionId?: string | null;
  category?: CreditSpendCategory;
  cost?: number;
  balanceAfter?: number;
  levelReward?: number;
};

export type AiCreditProgressResponse = {
  progress?: unknown;
  creditSpend?: AiCreditSpendReceipt;
};

type AiImageFunctionResponse = AiImageResult & AiCreditProgressResponse & {
  error?: string;
};

type AiRulesTextFunctionResponse = {
  content?: string;
  error?: string;
};

export type SubjectMatteDiagnosticAttempt = {
  endpointId: string;
  applyMask: boolean;
  status: "failed" | "success";
  error?: string;
  summary?: unknown;
};

export type SubjectMatteDiagnostics = {
  targetPrompt?: string;
  provider?: "fal-sam" | "fal" | "replicate";
  attempts?: SubjectMatteDiagnosticAttempt[];
};

export type SubjectMaskBoxPrompt = {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
};

export type SubjectMaskPointPrompt = {
  x: number;
  y: number;
  label: 0 | 1;
  object_id?: number;
};

type SubjectMatteFunctionResponse = AiImageResult & AiCreditProgressResponse & {
  provider?: "fal" | "fal-sam" | "replicate";
  // One cutout URL per matched concept (prompted multi-concept segmentation).
  // The client unions these into a single matte.
  urls?: string[];
  // Per-concept cutouts, so the client can offer per-subject toggles.
  subjectMasks?: { concept: string; url: string }[];
  diagnostics?: SubjectMatteDiagnostics;
  error?: string;
};

const OPENAI_IMAGE_EDGE_TIMEOUT_MS = 90000;
const OPENAI_RULES_TEXT_EDGE_TIMEOUT_MS = 30000;
const SUBJECT_MATTE_EDGE_TIMEOUT_MS = 120000;
const EDGE_IMAGE_FETCH_TIMEOUT_MS = 20000;
const MAX_EDGE_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
const BASE64_CHUNK_SIZE = 0x8000;

function logImageProviderFallback(actionLabel: string, data: AiImageResult) {
  if (!data.fallbackAttempts?.length) {
    return;
  }

  console.warn(`${actionLabel} used a fallback model.`, {
    providerModel: data.providerModel,
    fallbackAttempts: data.fallbackAttempts,
  });
}

export class SubjectMatteProviderError extends Error {
  readonly diagnostics?: SubjectMatteDiagnostics;

  constructor(message: string, diagnostics?: SubjectMatteDiagnostics) {
    super(message);
    this.name = "SubjectMatteProviderError";
    this.diagnostics = diagnostics;
  }
}

export async function generateAiImageViaEdge({
  prompt,
  options,
  spendCategory,
}: {
  prompt: string;
  options: AiImageGenerationOptions;
  spendCategory?: CreditSpendCategory;
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const data = await invokeAiEdgeFunction<AiImageFunctionResponse>({
    functionName: "openai-generate-image",
    actionLabel: "generating images",
    timeoutMs: OPENAI_IMAGE_EDGE_TIMEOUT_MS,
    body: { prompt, options, spendCategory },
  });

  if (data?.b64Json || data?.url) {
    logImageProviderFallback("OpenAI image generation", data);
    return data;
  }

  throw new Error(data?.error ?? "OpenAI did not return image data.");
}

export async function generateAiImageEditViaEdge({
  imageUri,
  prompt,
  size,
  spendCategory,
}: {
  imageUri: string;
  prompt: string;
  size: AiImageGenerationOptions["size"];
  spendCategory?: CreditSpendCategory;
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const imageDataUrl = await imageUriToDataUrl(imageUri);
  const data = await invokeAiEdgeFunction<AiImageFunctionResponse>({
    functionName: "openai-edit-image",
    actionLabel: "editing images",
    timeoutMs: OPENAI_IMAGE_EDGE_TIMEOUT_MS,
    body: { imageDataUrl, prompt, size, spendCategory },
  });

  if (data?.b64Json || data?.url) {
    logImageProviderFallback("OpenAI image edit", data);
    return data;
  }

  throw new Error(data?.error ?? "OpenAI did not return edited image data.");
}

export async function generateSubjectMatteViaEdge({
  imageUri,
  targetPrompt,
  boxPrompt,
  pointPrompts,
}: {
  imageUri: string;
  targetPrompt?: string;
  boxPrompt?: SubjectMaskBoxPrompt;
  pointPrompts?: SubjectMaskPointPrompt[];
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const accessToken = await getRequiredSupabaseAccessToken("generating subject masks");
  const imageDataUrl = await imageUriToDataUrl(imageUri);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUBJECT_MATTE_EDGE_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/functions/v1/generate-subject-matte`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ imageDataUrl, targetPrompt, boxPrompt, pointPrompts }),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      const hasGeometryPrompt = Boolean(boxPrompt) || Boolean(pointPrompts?.length);
      throw new SubjectMatteProviderError(
        targetPrompt || hasGeometryPrompt
          ? "Targeted masking is taking longer than expected. Try a smaller painted selection, one simpler visible object, or try again in a moment."
          : "Subject masking is taking too long. Try again in a moment.",
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
  const data = await response.json().catch(() => null) as SubjectMatteFunctionResponse | null;

  if (!response.ok) {
    throw new SubjectMatteProviderError(
      data?.error ?? `Subject matte provider failed with HTTP ${response.status}.`,
      data?.diagnostics,
    );
  }

  if (data?.b64Json || data?.url || data?.urls?.length) {
    return data;
  }

  throw new Error(data?.error ?? "Subject matte provider did not return image data.");
}

export async function fixRulesTextViaEdge(prompt: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const data = await invokeAiEdgeFunction<AiRulesTextFunctionResponse>({
    functionName: "openai-fix-rules-text",
    actionLabel: "fixing rules text",
    timeoutMs: OPENAI_RULES_TEXT_EDGE_TIMEOUT_MS,
    body: { prompt },
  });

  if (data?.content) {
    return data.content;
  }

  throw new Error(data?.error ?? "OpenAI did not return fixed rules text.");
}

async function imageUriToDataUrl(uri: string) {
  if (uri.startsWith("data:")) {
    assertDataUrlWithinUploadLimit(uri);
    return uri;
  }

  if (Platform.OS !== "web" && uri.startsWith("file://")) {
    const FileSystem = await import("expo-file-system");
    const info = await FileSystem.getInfoAsync(uri);

    if (info.exists && typeof info.size === "number" && info.size > MAX_EDGE_IMAGE_UPLOAD_BYTES) {
      throw new Error("Image is too large for AI processing.");
    }

    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });

    return `data:image/${getImageUriExtension(uri, "png") === "jpg" ? "jpeg" : getImageUriExtension(uri, "png")};base64,${base64}`;
  }

  const response = await fetchWithTimeout(
    uri,
    undefined,
    EDGE_IMAGE_FETCH_TIMEOUT_MS,
    "Image download timed out before AI processing could start.",
  );

  if (!response.ok) {
    throw new Error(`Image fetch failed with ${response.status}.`);
  }

  const blob = await response.blob();
  assertBlobWithinUploadLimit(blob);

  if (Platform.OS === "web" && typeof FileReader !== "undefined") {
    return await blobToDataUrl(blob);
  }

  const buffer = await blob.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  const mimeType = blob.type || `image/${getImageUriExtension(uri, "png")}`;

  return `data:${mimeType};base64,${base64}`;
}

async function getRequiredSupabaseAccessToken(actionLabel: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  const token = data.session?.access_token;

  if (token) {
    return token;
  }

  const { data: guestData, error: guestError } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        source: "cardmagic-guest-ai-credit-spend",
      },
    },
  });

  if (guestError) {
    throw new Error(`CardMagic could not start a guest credit session before ${actionLabel}. ${guestError.message}`);
  }

  const guestToken = guestData.session?.access_token;

  if (!guestToken) {
    throw new Error(`CardMagic could not start a guest credit session before ${actionLabel}.`);
  }

  return guestToken;
}

async function invokeAiEdgeFunction<T extends { error?: string }>({
  functionName,
  actionLabel,
  body,
  timeoutMs,
}: {
  functionName: string;
  actionLabel: string;
  body: Record<string, unknown>;
  timeoutMs: number;
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const accessToken = await getRequiredSupabaseAccessToken(actionLabel);
  const clientRequestId = createClientRequestId();
  const response = await fetchWithTimeout(
    `${supabaseUrl.replace(/\/$/, "")}/functions/v1/${functionName}`,
    {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ ...body, clientRequestId }),
    },
    timeoutMs,
    `CardMagic timed out while ${actionLabel}. Try again in a moment.`,
  );
  const data = await response.json().catch(() => null) as T | null;

  if (!response.ok) {
    throw new Error(data?.error ?? `${functionName} failed with HTTP ${response.status}.`);
  }

  return data ?? ({} as T);
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit | undefined,
  timeoutMs: number,
  timeoutMessage: string,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(timeoutMessage);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function createClientRequestId() {
  const randomUuid = globalThis.crypto?.randomUUID?.();

  if (randomUuid) {
    return randomUuid;
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function assertDataUrlWithinUploadLimit(dataUrl: string) {
  const base64 = dataUrl.match(/^data:[^;]+;base64,(.+)$/)?.[1];

  if (!base64) {
    return;
  }

  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const byteLength = Math.floor((base64.length * 3) / 4) - padding;

  if (byteLength > MAX_EDGE_IMAGE_UPLOAD_BYTES) {
    throw new Error("Image is too large for AI processing.");
  }
}

function assertBlobWithinUploadLimit(blob: Blob) {
  if (blob.size > MAX_EDGE_IMAGE_UPLOAD_BYTES) {
    throw new Error("Image is too large for AI processing.");
  }
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Image could not be converted for AI processing."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Image could not be read for AI processing."));
    reader.readAsDataURL(blob);
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let index = 0; index < bytes.length; index += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(index, index + BASE64_CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function getImageUriExtension(uri: string, fallback: string) {
  return uri.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/)?.[1]?.toLowerCase() ?? fallback;
}
