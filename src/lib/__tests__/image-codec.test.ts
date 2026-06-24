import { describe, expect, it } from "vitest";

import type * as ImageManipulator from "expo-image-manipulator";

import {
  getImageDataUriParts,
  getImageManipulatorExtension,
  getImageManipulatorMimeType,
  getImageUriExtension,
  getImageUriLogDescriptor,
} from "@/lib/image-codec";

// SaveFormat is a string-valued enum ("png" / "jpeg"); the codec helpers only
// stringify it, so plain strings stand in for the enum members in tests.
const asSaveFormat = (value: string) => value as unknown as ImageManipulator.SaveFormat;

describe("getImageDataUriParts", () => {
  it("parses a png data URI into extension + base64", () => {
    expect(getImageDataUriParts("data:image/png;base64,AAAA")).toEqual({
      extension: "png",
      base64: "AAAA",
    });
  });

  it("normalizes jpeg to jpg", () => {
    expect(getImageDataUriParts("data:image/jpeg;base64,ZZ")).toEqual({
      extension: "jpg",
      base64: "ZZ",
    });
  });

  it("returns null for non-data URIs", () => {
    expect(getImageDataUriParts("https://example.com/a.png")).toBeNull();
  });
});

describe("getImageManipulator mime/extension", () => {
  it("maps PNG to png", () => {
    expect(getImageManipulatorMimeType(asSaveFormat("png"))).toBe("image/png");
    expect(getImageManipulatorExtension(asSaveFormat("png"))).toBe("png");
  });

  it("maps anything else to jpeg/jpg", () => {
    expect(getImageManipulatorMimeType(asSaveFormat("jpeg"))).toBe("image/jpeg");
    expect(getImageManipulatorExtension(asSaveFormat("jpeg"))).toBe("jpg");
  });
});

describe("getImageUriExtension", () => {
  it("extracts the extension, lowercased, stripping query/hash", () => {
    expect(getImageUriExtension("https://x.com/a.PNG?v=2")).toBe("png");
    expect(getImageUriExtension("file:///tmp/pic.jpeg#frag")).toBe("jpg");
  });

  it("falls back when there is no extension", () => {
    expect(getImageUriExtension("https://x.com/noext")).toBe("png");
    expect(getImageUriExtension("https://x.com/noext", "webp")).toBe("webp");
  });
});

describe("getImageUriLogDescriptor", () => {
  it("classifies the URI kind and reports its length", () => {
    const dataUri = "data:image/png;base64,AA";
    expect(getImageUriLogDescriptor(dataUri)).toEqual({ kind: "data-uri", length: dataUri.length });
    expect(getImageUriLogDescriptor("blob:abc").kind).toBe("blob-uri");
    expect(getImageUriLogDescriptor("file:///a").kind).toBe("file-uri");
    expect(getImageUriLogDescriptor("relative/path").kind).toBe("uri");
  });

  it("captures the origin for remote URIs", () => {
    const descriptor = getImageUriLogDescriptor("https://ex.com/path/a.png?q=1");
    expect(descriptor.kind).toBe("remote-uri");
    expect("origin" in descriptor && descriptor.origin).toBe("https://ex.com");
  });
});
