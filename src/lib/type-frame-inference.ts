import { DEFAULT_BATTLE_SIEGE_REMINDER } from "@/lib/battle-card";
import { inferAutomaticFrameIdentity } from "@/lib/card-style";
import { getNextDfcFacePatch, isDfcBackFace, toDfcFacePatch } from "@/lib/dfc";
import { createDefaultLoyaltyAbilities } from "@/lib/planeswalker";
import { CardDraft, TypeFrame } from "@/types/card";

const TYPE_LINE_DIVIDER_PATTERN = /\s+[—–-]\s+/;
const TYPE_LINE_DOUBLE_SPACE_PATTERN = /(\S)[ \t]{2,}/;
const TYPE_LINE_PERIOD_SEPARATOR_PATTERN = /(\S)\s*\.\s*/;
const AUTO_INFERRED_TYPE_FRAMES: Array<TypeFrame | "standard"> = [
  "standard",
  "token",
  "saga",
  "planeswalker",
  "battle",
];

export function getTypeLineChangePatch(card: CardDraft, typeLine: string): Partial<CardDraft> {
  const normalizedTypeLine = normalizeTypeLineInput(typeLine);
  const facePatch = toDfcFacePatch(card, { typeLine: normalizedTypeLine });

  if (isDfcBackFace(card)) {
    return facePatch;
  }

  const currentTypeFrame = card.typeFrame ?? "standard";
  const inferredTypeFrame = inferTypeFrameFromTypeLine(normalizedTypeLine);

  if (!shouldApplyInferredTypeFrame(currentTypeFrame, inferredTypeFrame)) {
    return facePatch;
  }

  return {
    ...facePatch,
    typeFrame: inferredTypeFrame === "standard" ? undefined : inferredTypeFrame,
    ...getTypeFrameTransitionPatch(card, normalizedTypeLine, inferredTypeFrame),
  };
}

export function normalizeTypeLineInput(typeLine: string): string {
  if (TYPE_LINE_DIVIDER_PATTERN.test(typeLine)) {
    return typeLine;
  }

  return typeLine
    .replace(TYPE_LINE_PERIOD_SEPARATOR_PATTERN, "$1 — ")
    .replace(TYPE_LINE_DOUBLE_SPACE_PATTERN, "$1 — ");
}

export function inferTypeFrameFromTypeLine(typeLine: string): TypeFrame | "standard" {
  const { typeWords, subtypeWords } = parseTypeLineParts(typeLine);
  const normalizedTypes = typeWords.map(normalizeTypeWord);
  const normalizedSubtypes = subtypeWords.map(normalizeTypeWord);

  if (normalizedTypes.includes("Battle")) {
    return "battle";
  }

  if (normalizedTypes.includes("Planeswalker")) {
    return "planeswalker";
  }

  if (normalizedTypes.includes("Enchantment") && normalizedSubtypes.includes("Saga")) {
    return "saga";
  }

  if (normalizedTypes.includes("Token")) {
    return "token";
  }

  return "standard";
}

function shouldApplyInferredTypeFrame(
  currentTypeFrame: TypeFrame | "standard",
  inferredTypeFrame: TypeFrame | "standard",
): boolean {
  if (!AUTO_INFERRED_TYPE_FRAMES.includes(currentTypeFrame)) {
    return false;
  }

  return currentTypeFrame !== inferredTypeFrame;
}

function getTypeFrameTransitionPatch(
  card: CardDraft,
  typeLine: string,
  inferredTypeFrame: TypeFrame | "standard",
): Partial<CardDraft> {
  switch (inferredTypeFrame) {
    case "battle":
      return {
        ...getNextDfcFacePatch({
          ...card,
          typeFrame: "battle",
          typeLine,
          dfcFace: "front",
        }),
        dfcFace: "front",
        defense: card.defense || "3",
        rulesText:
          card.rulesText.trim().length > 0
            ? card.rulesText
            : `${DEFAULT_BATTLE_SIEGE_REMINDER}\nWhen this battle enters the battlefield, `,
      };
    case "planeswalker":
      return {
        startingLoyalty: card.startingLoyalty || "4",
        loyaltyAbilities:
          card.loyaltyAbilities && card.loyaltyAbilities.length > 0
            ? card.loyaltyAbilities
            : createDefaultLoyaltyAbilities(),
      };
    case "saga":
      return {};
    case "token":
      return {
        manaCost: "",
        power: card.power || "1",
        toughness: card.toughness || "1",
        frameSelection:
          card.frameSelection && card.frameSelection !== "auto"
            ? card.frameSelection
            : inferAutomaticFrameIdentity({ ...card, typeLine }),
      };
    case "standard":
    default:
      return {};
  }
}

function parseTypeLineParts(typeLine: string): { typeWords: string[]; subtypeWords: string[] } {
  const [typeText = "", subtypeText = ""] = typeLine.trim().split(TYPE_LINE_DIVIDER_PATTERN);

  return {
    typeWords: typeText.split(/\s+/).filter(Boolean),
    subtypeWords: subtypeText.split(/\s+/).filter(Boolean),
  };
}

function normalizeTypeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
