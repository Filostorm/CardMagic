import { describe, expect, it } from "vitest";

import { createUuid } from "@/lib/uuid";

describe("createUuid", () => {
  it("returns a v4-shaped UUID string", () => {
    expect(createUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("returns unique values across many calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createUuid()));
    expect(ids.size).toBe(1000);
  });
});
