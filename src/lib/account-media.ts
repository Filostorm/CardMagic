import { supabase } from "@/lib/supabase";
import type { CardDraft, SubjectMaskComponent } from "@/types/card";

const CARDMAGIC_REMOTE_MEDIA_BUCKET = "cardmagic-user-media";
const CARDMAGIC_REMOTE_MEDIA_URI_PREFIX = "cardmagic-remote-media://";
const CARDMAGIC_LOCAL_MEDIA_URI_PREFIX = "cardmagic-media://";
const CARD_REMOTE_MEDIA_KEYS = [
  "artUri",
  "artSubjectMaskUri",
  "backArtUri",
  "backArtSubjectMaskUri",
  "setSymbolUri",
  "watermarkUri",
] as const;
const CARD_SUBJECT_MASK_COMPONENT_KEYS = [
  "artSubjectMaskComponents",
  "backArtSubjectMaskComponents",
] as const;
const REMOTE_MEDIA_DATA_URI_CACHE_MAX_BYTES = 32 * 1024 * 1024;
const REMOTE_MEDIA_DATA_URI_CACHE_MAX_RECORDS = 48;

export type RemoteMediaScope =
  | {
      kind: "account";
      userId: string;
    }
  | {
      kind: "collaboration-set";
      setId: string;
    };

type RemoteMediaReference = {
  bucket: string;
  path: string;
  mimeType: string;
};

const remoteMediaDataUriCache = new Map<string, { dataUri: string; byteLength: number }>();
const remoteMediaUploadCache = new Map<string, Promise<string>>();
let remoteMediaDataUriCacheBytes = 0;

export function isCardMagicRemoteMediaReference(uri: string) {
  return uri.startsWith(CARDMAGIC_REMOTE_MEDIA_URI_PREFIX);
}

export async function persistRemoteImageUri(
  uri: string | undefined,
  scope: RemoteMediaScope,
  sourceLabel: string,
): Promise<string | undefined> {
  if (!uri || isCardMagicRemoteMediaReference(uri) || !shouldPersistRemoteMediaUri(uri)) {
    return uri;
  }

  if (uri.startsWith(CARDMAGIC_LOCAL_MEDIA_URI_PREFIX)) {
    throw new Error("Local media references must be materialized before Supabase sync.");
  }

  const blob = await readImageUriAsBlob(uri);
  const mimeType = normalizeRemoteMediaMimeType(blob.type, uri);
  const extension = getRemoteMediaExtension(mimeType, uri);
  const contentHash = await getBlobContentHash(blob);
  const cacheKey = `${getRemoteMediaScopeCacheKey(scope)}:${contentHash}.${extension}`;
  let pendingUpload = remoteMediaUploadCache.get(cacheKey);

  if (!pendingUpload) {
    pendingUpload = uploadRemoteImageBlob(blob, scope, sourceLabel, {
      contentHash,
      extension,
      mimeType,
    });
    remoteMediaUploadCache.set(cacheKey, pendingUpload);
    void pendingUpload.then(
      () => {
        if (remoteMediaUploadCache.get(cacheKey) === pendingUpload) {
          remoteMediaUploadCache.delete(cacheKey);
        }
      },
      () => {
        if (remoteMediaUploadCache.get(cacheKey) === pendingUpload) {
          remoteMediaUploadCache.delete(cacheKey);
        }
      },
    );
  }

  return pendingUpload;
}

export async function materializeRemoteImageUri(uri: string | undefined): Promise<string | undefined> {
  if (!uri || !isCardMagicRemoteMediaReference(uri)) {
    return uri;
  }

  const cached = getRemoteMediaDataUriCacheEntry(uri);

  if (cached) {
    return cached;
  }

  const reference = parseRemoteMediaReference(uri);

  if (!reference) {
    return uri;
  }

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.storage.from(reference.bucket).download(reference.path);

  if (error) {
    throw new Error(error.message);
  }

  const typedBlob = data.type ? data : data.slice(0, data.size, reference.mimeType);
  const dataUri = await blobToDataUri(typedBlob);

  setRemoteMediaDataUriCacheEntry(uri, dataUri);
  return dataUri;
}

export async function persistRemoteCardDraftMedia(
  card: CardDraft,
  scope: RemoteMediaScope,
  sourceLabel: string,
): Promise<CardDraft> {
  return transformCardDraftMedia(card, async (uri, fieldLabel) =>
    persistRemoteImageUri(uri, scope, `${sourceLabel}-${fieldLabel}`),
  );
}

export async function materializeRemoteCardDraftMedia(card: CardDraft): Promise<CardDraft> {
  return transformCardDraftMedia(card, async (uri) => {
    try {
      return await materializeRemoteImageUri(uri);
    } catch (error) {
      console.warn("Unable to materialize Supabase media reference.", error);
      return uri;
    }
  });
}

async function transformCardDraftMedia(
  card: CardDraft,
  transformUri: (uri: string, fieldLabel: string) => Promise<string | undefined>,
) {
  let nextCard = card;

  for (const key of CARD_REMOTE_MEDIA_KEYS) {
    const uri = nextCard[key];

    if (!uri) {
      continue;
    }

    const nextUri = await transformUri(uri, key);

    if (nextUri && nextUri !== uri) {
      nextCard = {
        ...nextCard,
        [key]: nextUri,
      };
    }
  }

  for (const key of CARD_SUBJECT_MASK_COMPONENT_KEYS) {
    const components = nextCard[key];

    if (!components?.length) {
      continue;
    }

    const nextComponents: SubjectMaskComponent[] = [];
    let changed = false;

    for (let index = 0; index < components.length; index += 1) {
      const component = components[index];
      const nextCutoutUrl = await transformUri(component.cutoutUrl, `${key}-${index}`);

      if (nextCutoutUrl && nextCutoutUrl !== component.cutoutUrl) {
        changed = true;
        nextComponents.push({ ...component, cutoutUrl: nextCutoutUrl });
      } else {
        nextComponents.push(component);
      }
    }

    if (changed) {
      nextCard = {
        ...nextCard,
        [key]: nextComponents,
      };
    }
  }

  return nextCard;
}

async function uploadRemoteImageBlob(
  blob: Blob,
  scope: RemoteMediaScope,
  sourceLabel: string,
  file: {
    contentHash: string;
    extension: string;
    mimeType: string;
  },
) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const path = getRemoteMediaPath(scope, `${file.contentHash}.${file.extension}`);
  const typedBlob = blob.type ? blob : blob.slice(0, blob.size, file.mimeType);
  const { error } = await supabase.storage.from(CARDMAGIC_REMOTE_MEDIA_BUCKET).upload(path, typedBlob, {
    contentType: file.mimeType,
    upsert: false,
  });

  if (error && !isExistingStorageObjectError(error)) {
    throw new Error(`Unable to upload ${sourceLabel}: ${error.message}`);
  }

  return createRemoteMediaReference({
    bucket: CARDMAGIC_REMOTE_MEDIA_BUCKET,
    path,
    mimeType: file.mimeType,
  });
}

function shouldPersistRemoteMediaUri(uri: string) {
  return (
    uri.startsWith("data:") ||
    uri.startsWith("blob:") ||
    uri.startsWith("file:") ||
    uri.startsWith("content:")
  );
}

function getRemoteMediaPath(scope: RemoteMediaScope, fileName: string) {
  if (scope.kind === "account") {
    return `users/${scope.userId}/${fileName}`;
  }

  return `sets/${scope.setId}/${fileName}`;
}

function getRemoteMediaScopeCacheKey(scope: RemoteMediaScope) {
  return scope.kind === "account" ? `account:${scope.userId}` : `collaboration-set:${scope.setId}`;
}

function getRemoteMediaDataUriCacheEntry(uri: string) {
  const cached = remoteMediaDataUriCache.get(uri);

  if (!cached) {
    return null;
  }

  remoteMediaDataUriCache.delete(uri);
  remoteMediaDataUriCache.set(uri, cached);
  return cached.dataUri;
}

function setRemoteMediaDataUriCacheEntry(uri: string, dataUri: string) {
  const existing = remoteMediaDataUriCache.get(uri);

  if (existing) {
    remoteMediaDataUriCacheBytes -= existing.byteLength;
    remoteMediaDataUriCache.delete(uri);
  }

  const byteLength = getStringByteEstimate(dataUri);
  remoteMediaDataUriCache.set(uri, { dataUri, byteLength });
  remoteMediaDataUriCacheBytes += byteLength;
  trimRemoteMediaDataUriCache();
}

function trimRemoteMediaDataUriCache() {
  while (
    remoteMediaDataUriCache.size > REMOTE_MEDIA_DATA_URI_CACHE_MAX_RECORDS ||
    remoteMediaDataUriCacheBytes > REMOTE_MEDIA_DATA_URI_CACHE_MAX_BYTES
  ) {
    const oldestKey = remoteMediaDataUriCache.keys().next().value;

    if (typeof oldestKey !== "string") {
      remoteMediaDataUriCache.clear();
      remoteMediaDataUriCacheBytes = 0;
      return;
    }

    const oldest = remoteMediaDataUriCache.get(oldestKey);
    remoteMediaDataUriCache.delete(oldestKey);
    remoteMediaDataUriCacheBytes -= oldest?.byteLength ?? 0;
  }
}

function getStringByteEstimate(value: string) {
  return value.length * 2;
}

function createRemoteMediaReference(reference: RemoteMediaReference) {
  const encodedPath = reference.path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${CARDMAGIC_REMOTE_MEDIA_URI_PREFIX}${reference.bucket}/${encodedPath}?mime=${encodeURIComponent(reference.mimeType)}`;
}

function parseRemoteMediaReference(uri: string): RemoteMediaReference | null {
  try {
    const parsed = new URL(uri);

    if (`${parsed.protocol}//` !== CARDMAGIC_REMOTE_MEDIA_URI_PREFIX) {
      return null;
    }

    const bucket = parsed.hostname;
    const path = parsed.pathname
      .replace(/^\/+/, "")
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/");

    if (!bucket || !path) {
      return null;
    }

    return {
      bucket,
      path,
      mimeType: normalizeRemoteMediaMimeType(parsed.searchParams.get("mime") ?? undefined, path),
    };
  } catch {
    return null;
  }
}

async function readImageUriAsBlob(uri: string): Promise<Blob> {
  if (uri.startsWith("data:")) {
    return dataUriToBlob(uri);
  }

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(`Image fetch failed with ${response.status}.`);
  }

  return response.blob();
}

function dataUriToBlob(dataUri: string) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUri);

  if (!match) {
    throw new Error("Expected an image data URI.");
  }

  const mimeType = match[1] || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const payload = match[3];
  const binary = isBase64 ? decodeBase64(payload) : decodeURIComponent(payload);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

async function blobToDataUri(blob: Blob) {
  if (typeof FileReader !== "undefined") {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Image blob could not be converted to a data URI."));
      };
      reader.onerror = () => {
        reject(reader.error ?? new Error("Image blob could not be read."));
      };
      reader.readAsDataURL(blob);
    });
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const base64 = encodeBase64(bytes);

  return `data:${blob.type || "application/octet-stream"};base64,${base64}`;
}

function normalizeRemoteMediaMimeType(mimeType: string | undefined, uri: string) {
  const normalizedMimeType = mimeType?.toLowerCase();

  if (
    normalizedMimeType === "image/png" ||
    normalizedMimeType === "image/jpeg" ||
    normalizedMimeType === "image/webp" ||
    normalizedMimeType === "image/heic" ||
    normalizedMimeType === "image/heif" ||
    normalizedMimeType === "image/gif"
  ) {
    return normalizedMimeType;
  }

  const extension = uri.split("?")[0]?.split("#")[0]?.split(".").pop()?.toLowerCase();

  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  if (extension === "heic") {
    return "image/heic";
  }

  if (extension === "heif") {
    return "image/heif";
  }

  if (extension === "gif") {
    return "image/gif";
  }

  return "image/png";
}

function getRemoteMediaExtension(mimeType: string, uri: string) {
  const extension = uri.split("?")[0]?.split("#")[0]?.split(".").pop()?.toLowerCase();

  if (extension === "png" || extension === "jpg" || extension === "jpeg" || extension === "webp" || extension === "heic" || extension === "heif" || extension === "gif") {
    return extension === "jpeg" ? "jpg" : extension;
  }

  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  if (mimeType === "image/heic") {
    return "heic";
  }

  if (mimeType === "image/heif") {
    return "heif";
  }

  if (mimeType === "image/gif") {
    return "gif";
  }

  return "png";
}

async function getBlobContentHash(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const cryptoLike = globalThis.crypto as Crypto | undefined;

  if (cryptoLike?.subtle) {
    const digest = await cryptoLike.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return `fnv1a64-${getFnv1a64Hash(bytes)}`;
}

function getFnv1a64Hash(bytes: Uint8Array) {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;

  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = (hash * prime) & mask;
  }

  return hash.toString(16).padStart(16, "0");
}

function isExistingStorageObjectError(error: { message?: string }) {
  return error.message?.toLowerCase().includes("already exists") ?? false;
}

function decodeBase64(value: string) {
  const atobLike = (globalThis as unknown as { atob?: (input: string) => string }).atob;

  if (atobLike) {
    return atobLike(value);
  }

  const bufferLike = (globalThis as unknown as {
    Buffer?: { from(input: string, encoding: "base64"): { toString(encoding: "binary"): string } };
  }).Buffer;

  if (bufferLike) {
    return bufferLike.from(value, "base64").toString("binary");
  }

  throw new Error("Base64 decoding is not available in this runtime.");
}

function encodeBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(offset, offset + chunkSize));
  }

  const btoaLike = (globalThis as unknown as { btoa?: (input: string) => string }).btoa;

  if (btoaLike) {
    return btoaLike(binary);
  }

  const bufferLike = (globalThis as unknown as {
    Buffer?: { from(input: Uint8Array): { toString(encoding: "base64"): string } };
  }).Buffer;

  if (bufferLike) {
    return bufferLike.from(bytes).toString("base64");
  }

  throw new Error("Base64 encoding is not available in this runtime.");
}
