import { describe, expect, it } from "vitest";

import { formatCompactCommentDate } from "@/lib/format-comment-date";

describe("formatCompactCommentDate", () => {
  it("formats a valid ISO date as a compact month/day label", () => {
    const iso = "2026-06-09T12:00:00Z";
    const expected = new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    expect(formatCompactCommentDate(iso)).toBe(expected);
  });

  it("returns an empty string for invalid or empty input", () => {
    expect(formatCompactCommentDate("not-a-date")).toBe("");
    expect(formatCompactCommentDate("")).toBe("");
  });
});
