import { describe, expect, it } from "vitest";

import { INITIAL_CARD } from "@/data/sample-card";
import {
  DEFAULT_ART_TRANSFORM,
  cardEditorReducer,
  getFrameGeometryArtResetPatch,
  withDefaultCardCredit,
} from "@/lib/card-editor-reducer";
import type { CardDraft } from "@/types/card";

const baseCard = (overrides: Partial<CardDraft> = {}): CardDraft => ({ ...INITIAL_CARD, ...overrides });

describe("cardEditorReducer — replace / mergeDefaults", () => {
  it("replace returns exactly the supplied card", () => {
    const next = baseCard({ name: "Replacement" });
    expect(cardEditorReducer(baseCard(), { type: "replace", card: next })).toBe(next);
  });

  it("mergeDefaults shallow-merges and never resets art", () => {
    const transform = { offsetX: 5, offsetY: 5, scale: 2 };
    const state = baseCard({ artUri: "art://1", frameTreatment: "standard", artTransform: transform });
    const out = cardEditorReducer(state, { type: "mergeDefaults", patch: { setCode: "AAA" } });
    expect(out.setCode).toBe("AAA");
    expect(out.artTransform).toBe(transform);
  });
});

describe("cardEditorReducer — patch + frame-geometry art reset", () => {
  it("resets the art transform when the frame treatment changes on a card with art", () => {
    const state = baseCard({
      artUri: "art://1",
      frameTreatment: "standard",
      artTransform: { offsetX: 9, offsetY: 9, scale: 3 },
    });
    const out = cardEditorReducer(state, { type: "patch", patch: { frameTreatment: "showcase" } });
    expect(out.frameTreatment).toBe("showcase");
    expect(out.artTransform).toEqual(DEFAULT_ART_TRANSFORM);
  });

  it("leaves the art transform untouched when only text changes", () => {
    const transform = { offsetX: 9, offsetY: 9, scale: 3 };
    const state = baseCard({ artUri: "art://1", artTransform: transform });
    const out = cardEditorReducer(state, { type: "patch", patch: { name: "New Name" } });
    expect(out.name).toBe("New Name");
    expect(out.artTransform).toBe(transform);
  });
});

describe("cardEditorReducer — applyDefaultCredit", () => {
  it("autofills the credit line when none is set", () => {
    const state = baseCard({ copyrightLine: undefined });
    const out = cardEditorReducer(state, { type: "applyDefaultCredit", ownerName: "Alice" });
    expect(out.copyrightLine).toContain("Alice");
    expect(out.copyrightLine).toContain(String(new Date().getFullYear()));
  });

  it("preserves referential identity when no autofill applies", () => {
    const state = baseCard({ copyrightLine: "Custom credit, all rights reserved" });
    expect(cardEditorReducer(state, { type: "applyDefaultCredit", ownerName: "Alice" })).toBe(state);
  });
});

describe("cardEditorReducer — flip side transitions", () => {
  it("convertToFlipSide switches to a DFC frame and the requested face", () => {
    const out = cardEditorReducer(baseCard({ typeFrame: "standard" }), {
      type: "convertToFlipSide",
      nextFace: "back",
    });
    expect(out.typeFrame).toBe("dfc");
    expect(out.dfcFace).toBe("back");
  });

  it("removeFlipSide clears the transform frame and back-face fields", () => {
    const state = baseCard({ typeFrame: "dfc", dfcFace: "back", backName: "Back Side", backRulesText: "Flip text" });
    const out = cardEditorReducer(state, { type: "removeFlipSide" });
    expect(out.typeFrame).toBeUndefined();
    expect(out.dfcFace).toBeUndefined();
    expect(out.backName).toBeUndefined();
    expect(out.backRulesText).toBeUndefined();
  });
});

describe("getFrameGeometryArtResetPatch (unit)", () => {
  it("returns an empty patch when nothing frame-related changes", () => {
    const card = baseCard({ artUri: "art://1", typeFrame: "standard", frameTreatment: "standard" });
    expect(getFrameGeometryArtResetPatch(card, { name: "x" })).toEqual({});
  });

  it("does not reset art for a frame change when the card has no art", () => {
    const card = baseCard({ artUri: undefined, frameTreatment: "standard" });
    expect(getFrameGeometryArtResetPatch(card, { frameTreatment: "showcase" })).toEqual({});
  });
});

describe("withDefaultCardCredit (unit)", () => {
  it("returns the same reference when the card already has a custom credit", () => {
    const card = baseCard({ copyrightLine: "Custom credit" });
    expect(withDefaultCardCredit(card, "Alice")).toBe(card);
  });

  it("returns the same reference when the owner name is the anonymous default", () => {
    const card = baseCard({ copyrightLine: undefined });
    expect(withDefaultCardCredit(card, "CardMagic Creator")).toBe(card);
  });
});
