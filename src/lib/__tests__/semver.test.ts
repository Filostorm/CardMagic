import { describe, expect, it } from "vitest";

import { compareSemanticVersions, isReleaseVersionNewer, parseSemanticVersion } from "@/lib/semver";

describe("parseSemanticVersion", () => {
  it("parses a well-formed version into a numeric tuple", () => {
    expect(parseSemanticVersion("3.36.36")).toEqual([3, 36, 36]);
  });

  it("trims surrounding whitespace", () => {
    expect(parseSemanticVersion("  1.2.3 ")).toEqual([1, 2, 3]);
  });

  it("returns null for non-3-part or malformed versions", () => {
    expect(parseSemanticVersion("1.2")).toBeNull();
    expect(parseSemanticVersion("1.2.3.4")).toBeNull();
    expect(parseSemanticVersion("v1.2.3")).toBeNull();
    expect(parseSemanticVersion("")).toBeNull();
  });
});

describe("compareSemanticVersions", () => {
  it("orders by major, then minor, then patch", () => {
    expect(compareSemanticVersions("1.0.0", "2.0.0")).toBeLessThan(0);
    expect(compareSemanticVersions("1.2.0", "1.1.9")).toBeGreaterThan(0);
    expect(compareSemanticVersions("1.1.2", "1.1.10")).toBeLessThan(0);
    expect(compareSemanticVersions("3.36.36", "3.36.36")).toBe(0);
  });

  it("does not compare numerically as strings (10 > 9)", () => {
    // string compare would put "1.1.10" < "1.1.9"; numeric compare must not.
    expect(compareSemanticVersions("1.1.10", "1.1.9")).toBeGreaterThan(0);
  });

  it("falls back to locale compare when a version is unparseable", () => {
    expect(compareSemanticVersions("abc", "abd")).toBeLessThan(0);
  });
});

describe("isReleaseVersionNewer", () => {
  it("is true only when latest is a string strictly newer than current", () => {
    expect(isReleaseVersionNewer("3.36.37", "3.36.36")).toBe(true);
    expect(isReleaseVersionNewer("3.36.36", "3.36.36")).toBe(false);
    expect(isReleaseVersionNewer("3.36.35", "3.36.36")).toBe(false);
    expect(isReleaseVersionNewer(undefined, "3.36.36")).toBe(false);
  });
});
