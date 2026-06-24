import type * as ImageManipulator from "expo-image-manipulator";

// Pure image data-URI / codec utilities extracted from App.tsx. These have no
// dependency on app state, native modules, or the web media store, so they live
// here as a standalone, unit-testable module.

export function getImageDataUriParts(uri: string): { extension: string; base64: string } | null {
  const match = uri.match(/^data:image\/([a-z0-9.+-]+);base64,(.+)$/i);

  if (!match) {
    return null;
  }

  const rawExtension = match[1].toLowerCase();

  return {
    extension: rawExtension === "jpeg" ? "jpg" : rawExtension,
    base64: match[2],
  };
}

export function getImageManipulatorMimeType(format: ImageManipulator.SaveFormat) {
  return String(format).toLowerCase().includes("png") ? "image/png" : "image/jpeg";
}

export function getImageManipulatorExtension(format: ImageManipulator.SaveFormat) {
  return String(format).toLowerCase().includes("png") ? "png" : "jpg";
}

export function readBlobAsDataUri(blob: Blob): Promise<string> {
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

export function getImageUriExtension(uri: string, fallback = "png") {
  const path = uri.split("?")[0]?.split("#")[0] ?? uri;
  const extension = path.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();

  if (!extension) {
    return fallback;
  }

  return extension === "jpeg" ? "jpg" : extension;
}

export function getImageUriLogDescriptor(uri: string) {
  if (uri.startsWith("data:")) {
    return { kind: "data-uri", length: uri.length };
  }

  if (uri.startsWith("blob:")) {
    return { kind: "blob-uri", length: uri.length };
  }

  if (/^https?:\/\//i.test(uri)) {
    try {
      const url = new URL(uri);

      return { kind: "remote-uri", origin: url.origin, length: uri.length };
    } catch {
      return { kind: "remote-uri", length: uri.length };
    }
  }

  if (uri.startsWith("file:")) {
    return { kind: "file-uri", length: uri.length };
  }

  return { kind: "uri", length: uri.length };
}
