import { Platform } from "react-native";

const WEB_STORAGE_DB_NAME = "cardmagic-storage";
const WEB_STORAGE_DB_VERSION = 3;
const WEB_STORAGE_STORE_NAME = "keyValue";
const WEB_MEDIA_STORE_NAME = "media";
const WEB_MEDIA_REFERENCE_STORE_NAME = "mediaReferences";
const WEB_MEDIA_LAST_USED_INDEX_NAME = "byLastUsedAt";
const WEB_MEDIA_REFERENCE_OWNER_INDEX_NAME = "byOwnerKey";
const WEB_MEDIA_REFERENCE_MEDIA_INDEX_NAME = "byMediaKey";
const CARDMAGIC_MEDIA_URI_PREFIX = "cardmagic-media://";
const WEB_MEDIA_STORE_MAX_RECORDS = 512;
const STORAGE_LOG_PREFIX = "[CardMagic web media store]";

type WebStoredMediaRecord = {
  schemaVersion: 1;
  blob: Blob;
  mimeType: string;
  byteLength: number;
  createdAt: string;
  lastUsedAt: string;
  source: string;
};

type WebStoredMediaReferenceRecord = {
  schemaVersion: 1;
  id: string;
  ownerKey: string;
  mediaKey: string;
  updatedAt: string;
};

let webStorageDatabasePromise: Promise<IDBDatabase> | null = null;
let webMediaStorePruneScheduled = false;

export function isWebMediaReference(uri: string) {
  return Boolean(getWebMediaReferenceKey(uri));
}

export async function persistWebMediaUri(uri: string, prefix: string, fallbackMimeType: string) {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return uri;
  }

  if (isWebMediaReference(uri)) {
    return uri;
  }

  try {
    const blob = await getWebImageBlob(uri, fallbackMimeType);
    const key = await getWebMediaContentKey(blob, prefix);
    const now = new Date().toISOString();

    await putWebMediaRecord(key, {
      schemaVersion: 1,
      blob,
      mimeType: blob.type || fallbackMimeType,
      byteLength: blob.size,
      createdAt: now,
      lastUsedAt: now,
      source: prefix,
    });
    scheduleWebMediaStorePrune();

    return createWebMediaReference(key);
  } catch (error) {
    logStorageWarning("Unable to persist web media into IndexedDB; preserving inline URI.", {
      prefix,
      uri: getImageUriLogDescriptor(uri),
      error,
    });
    return uri;
  }
}

export async function resolveWebMediaUri(uri: string, fallbackMimeType: string) {
  if (Platform.OS !== "web" || typeof window === "undefined" || !isWebMediaReference(uri)) {
    return uri;
  }

  const blob = await getWebImageBlob(uri, fallbackMimeType);

  return readBlobAsDataUri(blob);
}

export async function getWebStorageItem(key: string): Promise<string | null> {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  try {
    const database = await openWebStorageDatabase();

    return await new Promise<string | null>((resolve, reject) => {
      const transaction = database.transaction(WEB_STORAGE_STORE_NAME, "readonly");
      const store = transaction.objectStore(WEB_STORAGE_STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(typeof request.result === "string" ? request.result : window.localStorage.getItem(key));
      };
      request.onerror = () => {
        reject(request.error ?? new Error("IndexedDB read failed."));
      };
    });
  } catch (error) {
    logStorageWarning("CardMagic IndexedDB read unavailable; falling back to localStorage.", error);
    return window.localStorage.getItem(key);
  }
}

export async function setWebStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  try {
    const database = await openWebStorageDatabase();

    await putWebStorageItemWithMediaReferences(database, key, value);

    return;
  } catch (error) {
    logStorageWarning("CardMagic IndexedDB write unavailable; falling back to localStorage.", error);
    window.localStorage.setItem(key, value);
  }
}

function getWebMediaReferenceKey(uri: string) {
  if (!uri.startsWith(CARDMAGIC_MEDIA_URI_PREFIX)) {
    return null;
  }

  try {
    return decodeURIComponent(uri.slice(CARDMAGIC_MEDIA_URI_PREFIX.length));
  } catch {
    return uri.slice(CARDMAGIC_MEDIA_URI_PREFIX.length);
  }
}

function createWebMediaReference(key: string) {
  return `${CARDMAGIC_MEDIA_URI_PREFIX}${encodeURIComponent(key)}`;
}

async function getWebMediaRecord(key: string): Promise<WebStoredMediaRecord | null> {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  const database = await openWebStorageDatabase();

  return await new Promise<WebStoredMediaRecord | null>((resolve, reject) => {
    const transaction = database.transaction(WEB_MEDIA_STORE_NAME, "readonly");
    const store = transaction.objectStore(WEB_MEDIA_STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      const value = request.result;

      if (
        value &&
        typeof value === "object" &&
        (value as WebStoredMediaRecord).schemaVersion === 1 &&
        (value as WebStoredMediaRecord).blob instanceof Blob
      ) {
        resolve(value as WebStoredMediaRecord);
        return;
      }

      resolve(null);
    };
    request.onerror = () => reject(request.error ?? new Error("IndexedDB media read failed."));
  });
}

async function putWebMediaRecord(key: string, record: WebStoredMediaRecord) {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  const database = await openWebStorageDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(WEB_MEDIA_STORE_NAME, "readwrite");
    const store = transaction.objectStore(WEB_MEDIA_STORE_NAME);
    const request = store.put(record, key);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? request.error ?? new Error("IndexedDB media write failed."));
    transaction.onabort = () => reject(transaction.error ?? request.error ?? new Error("IndexedDB media write aborted."));
  });
}

async function getWebImageBlob(uri: string, fallbackMimeType: string): Promise<Blob> {
  const mediaKey = getWebMediaReferenceKey(uri);

  if (mediaKey) {
    const record = await getWebMediaRecord(mediaKey);

    if (!record) {
      throw new Error("Stored media record is unavailable.");
    }

    return record.blob.type ? record.blob : record.blob.slice(0, record.blob.size, record.mimeType || fallbackMimeType);
  }

  if (uri.startsWith("data:")) {
    const blob = dataUriToBlob(uri);
    return blob.type ? blob : blob.slice(0, blob.size, fallbackMimeType);
  }

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(`Image fetch failed with ${response.status}.`);
  }

  const blob = await response.blob();
  return blob.type ? blob : blob.slice(0, blob.size, fallbackMimeType);
}

async function getWebMediaContentKey(blob: Blob, prefix: string) {
  const safePrefix = prefix.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "") || "cardmagic-image";

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");

    return `${safePrefix}-${hash.slice(0, 32)}`;
  }

  return `${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function openWebStorageDatabase(): Promise<IDBDatabase> {
  if (webStorageDatabasePromise) {
    return webStorageDatabasePromise;
  }

  webStorageDatabasePromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      webStorageDatabasePromise = null;
      reject(new Error("IndexedDB is unavailable."));
      return;
    }

    const request = window.indexedDB.open(WEB_STORAGE_DB_NAME, WEB_STORAGE_DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = request.result;
      const transaction = request.transaction;

      if (!transaction) {
        return;
      }

      if (!database.objectStoreNames.contains(WEB_STORAGE_STORE_NAME)) {
        database.createObjectStore(WEB_STORAGE_STORE_NAME);
      }

      const mediaStore = database.objectStoreNames.contains(WEB_MEDIA_STORE_NAME)
        ? transaction.objectStore(WEB_MEDIA_STORE_NAME)
        : database.createObjectStore(WEB_MEDIA_STORE_NAME);

      if (!mediaStore.indexNames.contains(WEB_MEDIA_LAST_USED_INDEX_NAME)) {
        mediaStore.createIndex(WEB_MEDIA_LAST_USED_INDEX_NAME, "lastUsedAt");
      }

      const referenceStore = database.objectStoreNames.contains(WEB_MEDIA_REFERENCE_STORE_NAME)
        ? transaction.objectStore(WEB_MEDIA_REFERENCE_STORE_NAME)
        : database.createObjectStore(WEB_MEDIA_REFERENCE_STORE_NAME, { keyPath: "id" });

      if (!referenceStore.indexNames.contains(WEB_MEDIA_REFERENCE_OWNER_INDEX_NAME)) {
        referenceStore.createIndex(WEB_MEDIA_REFERENCE_OWNER_INDEX_NAME, "ownerKey");
      }

      if (!referenceStore.indexNames.contains(WEB_MEDIA_REFERENCE_MEDIA_INDEX_NAME)) {
        referenceStore.createIndex(WEB_MEDIA_REFERENCE_MEDIA_INDEX_NAME, "mediaKey");
      }

      if (event.oldVersion > 0 && event.oldVersion < 3) {
        backfillWebMediaReferenceStoreDuringUpgrade(transaction);
      }
    };
    request.onsuccess = () => {
      const database = request.result;

      database.onversionchange = () => {
        database.close();
        webStorageDatabasePromise = null;
      };
      resolve(database);
    };
    request.onerror = () => {
      webStorageDatabasePromise = null;
      reject(request.error ?? new Error("IndexedDB open failed."));
    };
  });

  return webStorageDatabasePromise;
}

function backfillWebMediaReferenceStoreDuringUpgrade(transaction: IDBTransaction) {
  const valueStore = transaction.objectStore(WEB_STORAGE_STORE_NAME);
  const referenceStore = transaction.objectStore(WEB_MEDIA_REFERENCE_STORE_NAME);
  const cursorRequest = valueStore.openCursor();

  cursorRequest.onsuccess = () => {
    const cursor = cursorRequest.result;

    if (!cursor) {
      return;
    }

    if (typeof cursor.key === "string" && typeof cursor.value === "string") {
      const updatedAt = new Date().toISOString();

      for (const mediaKey of getWebMediaReferencesForSerializedValue(cursor.value)) {
        referenceStore.put(createWebMediaReferenceRecord(cursor.key, mediaKey, updatedAt));
      }
    }

    cursor.continue();
  };
}

async function putWebStorageItemWithMediaReferences(database: IDBDatabase, key: string, value: string) {
  const referencedMediaKeys = getWebMediaReferencesForSerializedValue(value);

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      [WEB_STORAGE_STORE_NAME, WEB_MEDIA_REFERENCE_STORE_NAME],
      "readwrite",
    );
    const valueStore = transaction.objectStore(WEB_STORAGE_STORE_NAME);
    const referenceStore = transaction.objectStore(WEB_MEDIA_REFERENCE_STORE_NAME);
    const referenceOwnerIndex = referenceStore.index(WEB_MEDIA_REFERENCE_OWNER_INDEX_NAME);
    const valueRequest = valueStore.put(value, key);
    const ownerCursorRequest = referenceOwnerIndex.openCursor(IDBKeyRange.only(key));

    ownerCursorRequest.onsuccess = () => {
      const cursor = ownerCursorRequest.result;

      if (cursor) {
        cursor.delete();
        cursor.continue();
        return;
      }

      const updatedAt = new Date().toISOString();

      for (const mediaKey of referencedMediaKeys) {
        referenceStore.put(createWebMediaReferenceRecord(key, mediaKey, updatedAt));
      }
    };
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      reject(transaction.error ?? valueRequest.error ?? new Error("IndexedDB write failed."));
    };
    transaction.onabort = () => {
      reject(transaction.error ?? valueRequest.error ?? new Error("IndexedDB write aborted."));
    };
  });
}

function scheduleWebMediaStorePrune() {
  if (Platform.OS !== "web" || typeof window === "undefined" || webMediaStorePruneScheduled) {
    return;
  }

  webMediaStorePruneScheduled = true;
  window.setTimeout(() => {
    webMediaStorePruneScheduled = false;
    void pruneWebMediaStore().catch((error) => {
      logStorageWarning("CardMagic media-store pruning failed.", error);
    });
  }, 1500);
}

async function pruneWebMediaStore() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  const database = await openWebStorageDatabase();
  const mediaCount = await getWebMediaRecordCount(database);

  if (mediaCount <= WEB_MEDIA_STORE_MAX_RECORDS) {
    return;
  }

  const referencedKeys = await getReferencedWebMediaKeys(database);
  const deleteCount = mediaCount - WEB_MEDIA_STORE_MAX_RECORDS;
  const candidates = await getWebMediaPruneCandidates(database, referencedKeys, deleteCount);

  if (candidates.length === 0) {
    return;
  }

  await deleteWebMediaRecords(database, candidates);

  logStorageInfo("Pruned unreferenced web media records.", {
    deleted: candidates.length,
    retained: mediaCount - candidates.length,
  });
}

async function getWebMediaRecordCount(database: IDBDatabase) {
  return await new Promise<number>((resolve, reject) => {
    const transaction = database.transaction(WEB_MEDIA_STORE_NAME, "readonly");
    const request = transaction.objectStore(WEB_MEDIA_STORE_NAME).count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB media count failed."));
    transaction.onerror = () => reject(transaction.error ?? request.error ?? new Error("IndexedDB media count failed."));
    transaction.onabort = () => reject(transaction.error ?? request.error ?? new Error("IndexedDB media count aborted."));
  });
}

async function getReferencedWebMediaKeys(database: IDBDatabase) {
  return await new Promise<Set<string>>((resolve, reject) => {
    const refs = new Set<string>();
    const transaction = database.transaction(WEB_MEDIA_REFERENCE_STORE_NAME, "readonly");
    const store = transaction.objectStore(WEB_MEDIA_REFERENCE_STORE_NAME);
    const cursorRequest = store.index(WEB_MEDIA_REFERENCE_MEDIA_INDEX_NAME).openCursor();

    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;

      if (!cursor) {
        return;
      }

      const mediaKey = (cursor.value as WebStoredMediaReferenceRecord | undefined)?.mediaKey;

      if (typeof mediaKey === "string") {
        refs.add(mediaKey);
      }

      cursor.continue();
    };
    transaction.oncomplete = () => resolve(refs);
    transaction.onerror = () => reject(transaction.error ?? cursorRequest.error ?? new Error("IndexedDB media reference scan failed."));
    transaction.onabort = () => reject(transaction.error ?? cursorRequest.error ?? new Error("IndexedDB media reference scan aborted."));
  });
}

async function getWebMediaPruneCandidates(
  database: IDBDatabase,
  referencedKeys: Set<string>,
  maxCandidates: number,
) {
  if (maxCandidates <= 0) {
    return [];
  }

  return await new Promise<string[]>((resolve, reject) => {
    const candidates: string[] = [];
    const transaction = database.transaction(WEB_MEDIA_STORE_NAME, "readonly");
    const store = transaction.objectStore(WEB_MEDIA_STORE_NAME);
    const cursorRequest = store.index(WEB_MEDIA_LAST_USED_INDEX_NAME).openCursor();

    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;

      if (!cursor || candidates.length >= maxCandidates) {
        return;
      }

      const key = typeof cursor.primaryKey === "string" ? cursor.primaryKey : String(cursor.primaryKey);

      if (!referencedKeys.has(key)) {
        candidates.push(key);
      }

      cursor.continue();
    };
    transaction.oncomplete = () => resolve(candidates);
    transaction.onerror = () => reject(transaction.error ?? cursorRequest.error ?? new Error("IndexedDB media prune scan failed."));
    transaction.onabort = () => reject(transaction.error ?? cursorRequest.error ?? new Error("IndexedDB media prune scan aborted."));
  });
}

async function deleteWebMediaRecords(database: IDBDatabase, keys: string[]) {
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(WEB_MEDIA_STORE_NAME, "readwrite");
    const store = transaction.objectStore(WEB_MEDIA_STORE_NAME);

    for (const key of keys) {
      store.delete(key);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB media prune failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB media prune aborted."));
  });
}

function collectWebMediaReferences(value: unknown, refs: Set<string>) {
  if (typeof value === "string") {
    const key = getWebMediaReferenceKey(value);

    if (key) {
      refs.add(key);
    }

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectWebMediaReferences(entry, refs));
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  Object.values(value as Record<string, unknown>).forEach((entry) => collectWebMediaReferences(entry, refs));
}

function getWebMediaReferencesForSerializedValue(value: string) {
  const refs = new Set<string>();

  try {
    collectWebMediaReferences(JSON.parse(value) as unknown, refs);
  } catch {
    collectWebMediaReferences(value, refs);
  }

  return refs;
}

function createWebMediaReferenceRecord(
  ownerKey: string,
  mediaKey: string,
  updatedAt: string,
): WebStoredMediaReferenceRecord {
  return {
    schemaVersion: 1,
    id: `${encodeURIComponent(ownerKey)}::${encodeURIComponent(mediaKey)}`,
    ownerKey,
    mediaKey,
    updatedAt,
  };
}

function readBlobAsDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
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

function dataUriToBlob(dataUri: string) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUri);

  if (!match) {
    throw new Error("Expected an image data URI.");
  }

  const mimeType = match[1] || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const payload = match[3];
  const binary = isBase64 ? window.atob(payload) : decodeURIComponent(payload);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function getImageUriLogDescriptor(uri: string) {
  if (uri.startsWith("data:")) {
    return `data-uri:${uri.length}`;
  }

  return uri.slice(0, 160);
}

function logStorageInfo(message: string, detail?: unknown) {
  if (detail === undefined) {
    console.info(STORAGE_LOG_PREFIX, message);
    return;
  }

  console.info(STORAGE_LOG_PREFIX, message, detail);
}

function logStorageWarning(message: string, detail?: unknown) {
  if (detail === undefined) {
    console.warn(STORAGE_LOG_PREFIX, message);
    return;
  }

  console.warn(STORAGE_LOG_PREFIX, message, detail);
}
