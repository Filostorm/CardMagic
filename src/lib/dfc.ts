import { CardDraft, DfcMode } from "@/types/card";
import { getFrameColors } from "@/lib/card-style";

export function isDfcBackFace(card: CardDraft): boolean {
  return isTransformingTypeFrame(card) && card.dfcFace === "back";
}

export function isTransformingTypeFrame(card: CardDraft): boolean {
  return card.typeFrame === "dfc" || card.typeFrame === "battle";
}

export function getDfcMode(card: CardDraft): DfcMode {
  return card.dfcMode ?? "transform";
}

export function isModalDfc(card: CardDraft): boolean {
  return card.typeFrame === "dfc" && getDfcMode(card) === "modal";
}

export function shouldShowDfcFaceManaCost(card: CardDraft): boolean {
  return !isDfcBackFace(card) || isModalDfc(card);
}

export function getEditableCardFace(card: CardDraft): CardDraft {
  if (!isDfcBackFace(card)) {
    return card;
  }

  const backDefaults = getDefaultDfcBackPatch(card);

  return {
    ...card,
    name: card.backName ?? backDefaults.backName ?? "",
    baseCardName: card.backBaseCardName ?? backDefaults.backBaseCardName,
    manaCost: card.backManaCost ?? backDefaults.backManaCost ?? "",
    typeLine: card.backTypeLine ?? backDefaults.backTypeLine ?? "",
    rulesText: card.backRulesText ?? backDefaults.backRulesText ?? "",
    rulesTextColors: card.backRulesTextColors ?? backDefaults.backRulesTextColors,
    rulesTextColor: card.backRulesTextColor ?? backDefaults.backRulesTextColor,
    flavorText: card.backFlavorText ?? backDefaults.backFlavorText ?? "",
    keywords: card.backKeywords ?? backDefaults.backKeywords,
    power: card.backPower ?? backDefaults.backPower ?? "",
    toughness: card.backToughness ?? backDefaults.backToughness ?? "",
    artUri: card.backArtUri,
    artSubjectMaskUri: card.backArtSubjectMaskUri,
    artSubjectMaskDisabled: card.backArtSubjectMaskDisabled,
    artSubjectMaskComponents: card.backArtSubjectMaskComponents,
    artTransform: card.backArtTransform,
    frameSelection:
      card.backFrameSelection ?? backDefaults.backFrameSelection ?? card.frameSelection,
    frameColors: card.backFrameColors ?? backDefaults.backFrameColors ?? card.frameColors,
    frameTreatment: card.backFrameTreatment ?? backDefaults.backFrameTreatment ?? "standard",
    showcaseFrame: card.backShowcaseFrame ?? backDefaults.backShowcaseFrame ?? card.showcaseFrame,
  };
}

export function toDfcFacePatch(card: CardDraft, patch: Partial<CardDraft>): Partial<CardDraft> {
  if (!isDfcBackFace(card)) {
    return patch;
  }

  const {
    name,
    baseCardName,
    manaCost,
    typeLine,
    rulesText,
    rulesTextColors,
    rulesTextColor,
    flavorText,
    keywords,
    power,
    toughness,
    artUri,
    artSubjectMaskUri,
    artSubjectMaskDisabled,
    artSubjectMaskComponents,
    artTransform,
    frameSelection,
    frameColors,
    frameTreatment,
    showcaseFrame,
    ...sharedPatch
  } = patch;
  const nextPatch: Partial<CardDraft> = { ...sharedPatch };

  if (name !== undefined) {
    nextPatch.backName = name;
  }

  if (baseCardName !== undefined) {
    nextPatch.backBaseCardName = baseCardName;
  }

  if (manaCost !== undefined) {
    nextPatch.backManaCost = manaCost;
  }

  if (typeLine !== undefined) {
    nextPatch.backTypeLine = typeLine;
  }

  if (rulesText !== undefined) {
    nextPatch.backRulesText = rulesText;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "rulesTextColors")) {
    nextPatch.backRulesTextColors = rulesTextColors;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "rulesTextColor")) {
    nextPatch.backRulesTextColor = rulesTextColor;
  }

  if (flavorText !== undefined) {
    nextPatch.backFlavorText = flavorText;
  }

  if (keywords !== undefined) {
    nextPatch.backKeywords = keywords;
  }

  if (power !== undefined) {
    nextPatch.backPower = power;
  }

  if (toughness !== undefined) {
    nextPatch.backToughness = toughness;
  }

  if (artUri !== undefined) {
    nextPatch.backArtUri = artUri;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "artSubjectMaskUri")) {
    nextPatch.backArtSubjectMaskUri = artSubjectMaskUri;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "artSubjectMaskDisabled")) {
    nextPatch.backArtSubjectMaskDisabled = artSubjectMaskDisabled;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "artSubjectMaskComponents")) {
    nextPatch.backArtSubjectMaskComponents = artSubjectMaskComponents;
  }

  if (artTransform !== undefined) {
    nextPatch.backArtTransform = artTransform;
  }

  if (frameSelection !== undefined) {
    nextPatch.backFrameSelection = frameSelection;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "frameColors")) {
    nextPatch.backFrameColors = frameColors;
  }

  if (frameTreatment !== undefined) {
    nextPatch.backFrameTreatment = frameTreatment;
  }

  if (showcaseFrame !== undefined) {
    nextPatch.backShowcaseFrame = showcaseFrame;
  }

  return nextPatch;
}

export function getDefaultDfcBackPatch(card: CardDraft): Partial<CardDraft> {
  const baseName = card.name.trim() || "Untitled";
  const frontFramePatch: Partial<CardDraft> = {
    backFrameSelection: card.backFrameSelection ?? card.frameSelection ?? "auto",
    backFrameColors: card.backFrameColors ?? card.frameColors ?? getFrameColors(card),
    backFrameTreatment: card.backFrameTreatment ?? "standard",
    backShowcaseFrame: card.backShowcaseFrame,
  };

  if (card.typeFrame === "battle") {
    const planeName = baseName.replace(/^Invasion of\s+/i, "").trim() || "the Plane";

    return {
      ...frontFramePatch,
      backName: card.backName || `${planeName} Reclaimed`,
      backManaCost: card.backManaCost ?? "",
      backTypeLine: card.backTypeLine || "Creature — Elemental",
      backRulesText:
        card.backRulesText ||
        "Vigilance\nWhen this creature enters, put a +1/+1 counter on each creature you control.",
      backFlavorText: card.backFlavorText ?? "",
      backPower: card.backPower ?? "4",
      backToughness: card.backToughness ?? "4",
    };
  }

  if (isModalDfc(card)) {
    return {
      ...frontFramePatch,
      backName: card.backName || `${baseName} Refuge`,
      backManaCost: card.backManaCost ?? "",
      backTypeLine: card.backTypeLine || "Land",
      backRulesText: card.backRulesText || "{T}: Add {C}.",
      backFlavorText: card.backFlavorText ?? "",
      backPower: card.backPower ?? "",
      backToughness: card.backToughness ?? "",
    };
  }

  return {
    ...frontFramePatch,
    backName: card.backName || `${baseName}, Awakened`,
    backManaCost: card.backManaCost ?? "",
    backTypeLine: card.backTypeLine || "Creature — Spirit",
    backRulesText:
      card.backRulesText ||
      "When this creature enters, return up to one target permanent card from your graveyard to your hand.",
    backFlavorText: card.backFlavorText ?? "",
    backPower: card.backPower ?? "3",
    backToughness: card.backToughness ?? "3",
  };
}

export function getDfcFaceLabel(card: CardDraft): "Front" | "Back" {
  return isDfcBackFace(card) ? "Back" : "Front";
}

export function getNextDfcFacePatch(card: CardDraft): Partial<CardDraft> {
  if (isDfcBackFace(card)) {
    return { dfcFace: "front" };
  }

  return {
    ...getDefaultDfcBackPatch(card),
    dfcMode: card.typeFrame === "dfc" ? getDfcMode(card) : card.dfcMode,
    dfcFace: "back",
  };
}
