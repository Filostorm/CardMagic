import { describe, expect, it } from "vitest";

import { INITIAL_CARD } from "@/data/sample-card";
import { buildSlopCardArtPrompt, createSlopCard } from "@/lib/random-card";

describe("createSlopCard", () => {
  it("creates an editor-safe nonsense card and clears stale art state", () => {
    const card = createSlopCard({
      ...INITIAL_CARD,
      artUri: "art://old",
      artSubjectMaskUri: "mask://old",
      typeFrame: "dfc",
      backName: "Old Back",
      setCode: "SLOP",
    });

    expect(card.name).toMatch(/\S/);
    expect(card.typeLine).toMatch(/\S/);
    expect(card.rulesText).toContain("\n");
    expect(card.setCode).toBe("SLOP");
    expect(card.artUri).toBeUndefined();
    expect(card.artSubjectMaskUri).toBeUndefined();
    expect(card.typeFrame).toBeUndefined();
    expect(card.backName).toBeUndefined();
  });
});

describe("buildSlopCardArtPrompt", () => {
  it("anchors the nonsensical art request to the generated card", () => {
    const card = createSlopCard(INITIAL_CARD);
    const prompt = buildSlopCardArtPrompt(card);

    expect(prompt).toContain(card.name);
    expect(prompt).toContain(card.typeLine);
    expect(prompt).toContain("No text");
  });
});
