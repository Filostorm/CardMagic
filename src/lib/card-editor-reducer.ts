import { DEFAULT_SHOWCASE_FRAME } from "@/data/showcase-frames";
import { INITIAL_CARD } from "@/data/sample-card";
import { getDefaultDfcBackPatch } from "@/lib/dfc";
import { DEFAULT_CARD_COPYRIGHT_LINE } from "@/lib/printing";
import { createRandomCard } from "@/lib/random-card";
import type { ArtTransform, CardDraft } from "@/types/card";

// The editor's active-card state machine plus the pure card-construction and
// frame-geometry helpers it depends on, extracted from App.tsx. Self-contained
// (imports no app state), so the reducer and its helpers are unit-testable.

export const DEFAULT_ART_TRANSFORM: ArtTransform = { offsetX: 0, offsetY: 0, scale: 1 };

function hasOwnPatchKey<T extends object>(patch: Partial<T>, key: keyof T) {
  return Object.prototype.hasOwnProperty.call(patch, key);
}

export function getDefaultCardCreditLine(ownerName: string) {
  const normalizedOwnerName = ownerName.trim();

  if (!normalizedOwnerName || normalizedOwnerName === "CardMagic Creator") {
    return null;
  }

  return `${normalizedOwnerName} & ${new Date().getFullYear()} CardMagic`;
}

export function shouldAutofillCardCredit(copyrightLine: string | undefined) {
  const normalizedCopyrightLine = copyrightLine?.trim();

  return !normalizedCopyrightLine || normalizedCopyrightLine === DEFAULT_CARD_COPYRIGHT_LINE;
}

export function withDefaultCardCredit(card: CardDraft, ownerName: string) {
  if (!shouldAutofillCardCredit(card.copyrightLine)) {
    return card;
  }

  const defaultCreditLine = getDefaultCardCreditLine(ownerName);

  if (!defaultCreditLine) {
    return card;
  }

  return {
    ...card,
    copyrightLine: defaultCreditLine,
  };
}

export function getNextCollectorNumber(value: string): string {
  const match = value.trim().match(/^(\D*)(\d+)(\D*)$/);

  if (!match) {
    return value.trim() ? value : "2";
  }

  const [, prefix, numberText, suffix] = match;
  const nextNumber = String(Number(numberText) + 1).padStart(numberText.length, "0");

  return `${prefix}${nextNumber}${suffix}`;
}

export function createNextBlankCard(previous: CardDraft): CardDraft {
  return {
    ...INITIAL_CARD,
    artist: previous.artist,
    setCode: previous.setCode,
    collectorNumber: getNextCollectorNumber(previous.collectorNumber),
    setSymbolPreset: previous.setSymbolPreset,
    setSymbolUri: previous.setSymbolUri,
    cardBackId: previous.cardBackId,
  };
}

export function createStarterCard(): CardDraft {
  return createRandomCard(INITIAL_CARD);
}

export function getFrameGeometryArtResetPatch(current: CardDraft, patch: Partial<CardDraft>): Partial<CardDraft> {
  const nextTypeFrame = hasOwnPatchKey(patch, "typeFrame") ? patch.typeFrame : current.typeFrame;
  const nextFrameTreatment = hasOwnPatchKey(patch, "frameTreatment")
    ? patch.frameTreatment
    : current.frameTreatment;
  const nextBackFrameTreatment = hasOwnPatchKey(patch, "backFrameTreatment")
    ? patch.backFrameTreatment
    : current.backFrameTreatment;
  const nextShowcaseFrame = hasOwnPatchKey(patch, "showcaseFrame")
    ? patch.showcaseFrame
    : current.showcaseFrame;
  const nextBackShowcaseFrame = hasOwnPatchKey(patch, "backShowcaseFrame")
    ? patch.backShowcaseFrame
    : current.backShowcaseFrame;
  const typeFrameChanged = (current.typeFrame ?? "standard") !== (nextTypeFrame ?? "standard");
  const treatmentChanged = (current.frameTreatment ?? "standard") !== (nextFrameTreatment ?? "standard");
  const backTreatmentChanged =
    (current.backFrameTreatment ?? "standard") !== (nextBackFrameTreatment ?? "standard");
  const showcaseChanged =
    (current.showcaseFrame ?? DEFAULT_SHOWCASE_FRAME) !== (nextShowcaseFrame ?? DEFAULT_SHOWCASE_FRAME);
  const backShowcaseChanged =
    (current.backShowcaseFrame ?? DEFAULT_SHOWCASE_FRAME) !==
    (nextBackShowcaseFrame ?? DEFAULT_SHOWCASE_FRAME);

  if (!typeFrameChanged && !treatmentChanged && !backTreatmentChanged && !showcaseChanged && !backShowcaseChanged) {
    return {};
  }

  const resetFrontArt = typeFrameChanged || treatmentChanged || showcaseChanged;
  const resetBackArt = typeFrameChanged || backTreatmentChanged || backShowcaseChanged;

  return {
    ...(resetFrontArt && current.artUri ? { artTransform: DEFAULT_ART_TRANSFORM } : {}),
    ...(resetBackArt && current.backArtUri ? { backArtTransform: DEFAULT_ART_TRANSFORM } : {}),
  };
}

export type CardEditorAction =
  | { type: "replace"; card: CardDraft }
  | { type: "patch"; patch: Partial<CardDraft> }
  | { type: "mergeDefaults"; patch: Partial<CardDraft> }
  | { type: "applyDefaultCredit"; ownerName: string }
  | { type: "reset" }
  | { type: "randomize" }
  | { type: "nextBlank" }
  | { type: "convertToFlipSide"; nextFace: NonNullable<CardDraft["dfcFace"]> }
  | { type: "removeFlipSide" };

export function cardEditorReducer(state: CardDraft, action: CardEditorAction): CardDraft {
  switch (action.type) {
    case "replace":
      return action.card;
    case "patch":
      return {
        ...state,
        ...action.patch,
        ...getFrameGeometryArtResetPatch(state, action.patch),
      };
    case "mergeDefaults":
      return { ...state, ...action.patch };
    case "applyDefaultCredit": {
      const credited = withDefaultCardCredit(state, action.ownerName);
      // Preserve referential identity when nothing changed so React can bail
      // out of the re-render, matching the prior functional-setState guard.
      return credited === state ? state : credited;
    }
    case "reset":
      return createStarterCard();
    case "randomize":
      return createRandomCard(state);
    case "nextBlank":
      return createNextBlankCard(state);
    case "convertToFlipSide": {
      const typeFrame: NonNullable<CardDraft["typeFrame"]> =
        state.typeFrame === "battle" ? "battle" : "dfc";
      const dfcMode = typeFrame === "dfc" ? (state.dfcMode ?? "transform") : state.dfcMode;
      const nextCard: CardDraft = {
        ...state,
        typeFrame,
        dfcMode,
        dfcFace: "front" as const,
      };

      return {
        ...nextCard,
        ...getDefaultDfcBackPatch(nextCard),
        dfcFace: action.nextFace,
      };
    }
    case "removeFlipSide": {
      const removesTransformFrame = state.typeFrame === "dfc" || state.typeFrame === "battle";

      return {
        ...state,
        typeFrame: removesTransformFrame ? undefined : state.typeFrame,
        dfcFace: undefined,
        dfcMode: removesTransformFrame ? undefined : state.dfcMode,
        backName: undefined,
        backBaseCardName: undefined,
        backManaCost: undefined,
        backTypeLine: undefined,
        backRulesText: undefined,
        backFlavorText: undefined,
        backKeywords: undefined,
        backPower: undefined,
        backToughness: undefined,
        backArtUri: undefined,
        backArtTransform: undefined,
        backFrameSelection: undefined,
        backFrameColors: undefined,
        backFrameTreatment: undefined,
        backShowcaseFrame: undefined,
      };
    }
    default: {
      const unreachable: never = action;
      return unreachable;
    }
  }
}
