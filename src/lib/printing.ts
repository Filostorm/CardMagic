import { CardDraft, CardRarity } from "@/types/card";

export const DEFAULT_CARD_LANGUAGE = "EN";
export const DEFAULT_CARD_SET_SIZE = "001";
export const DEFAULT_CARD_COPYRIGHT_LINE = "™ & © 2026 CardMagic";

const RARITY_CODES: Record<CardRarity, string> = {
  common: "C",
  uncommon: "U",
  rare: "R",
  mythic: "M",
};

function fallbackText(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function getRarityCode(rarity: CardRarity) {
  return RARITY_CODES[rarity];
}

export function getModernCollectorLine(card: CardDraft) {
  const collectorNumber = fallbackText(card.collectorNumber, "001");
  const setSize = fallbackText(card.setSize, DEFAULT_CARD_SET_SIZE);
  const collectorWithSetSize = collectorNumber.includes("/")
    ? collectorNumber
    : `${collectorNumber}/${setSize}`;

  return `${collectorWithSetSize} ${getRarityCode(card.rarity)}`;
}

export function getModernSetLanguageLine(card: CardDraft) {
  const setCode = fallbackText(card.setCode, "CMG").toUpperCase();
  const language = fallbackText(card.language, DEFAULT_CARD_LANGUAGE).toUpperCase();

  return `${setCode} • ${language}`;
}

export function getModernArtistLine(card: CardDraft) {
  return fallbackText(card.artist, "Local Artist").toUpperCase();
}

export function getModernCopyrightLine(card: CardDraft) {
  return fallbackText(card.copyrightLine, DEFAULT_CARD_COPYRIGHT_LINE);
}
