import { DEFAULT_BATTLE_SIEGE_REMINDER } from "@/lib/battle-card";
import { CardDraft, ManaColor, PlaneswalkerLoyaltyAbility, SplitCardLayout, TypeFrame } from "@/types/card";

const rawDatabase = require("../../assets/card-data/scryfall-oracle-cards.compact.json") as CardDatabaseFile;

export type CardDatabaseFace = {
  name: string;
  manaCost: string;
  typeLine: string;
  oracleText: string;
  power: string;
  toughness: string;
  loyalty: string;
  defense: string;
};

export type CardDatabaseEntry = CardDatabaseFace & {
  id: string;
  layout: string;
  colors: ManaColor[];
  colorIdentity: ManaColor[];
  faces: CardDatabaseFace[];
};

export type CardDatabaseMetadata = {
  source: string;
  sourceUri: string;
  downloadUri: string;
  updatedAt: string;
  generatedAt: string;
  cardCount: number;
};

type CardDatabaseFile = {
  source: string;
  sourceUri: string;
  downloadUri: string;
  updatedAt: string;
  generatedAt: string;
  cards: CardDatabaseEntry[];
};

type SearchCandidate = {
  entry: CardDatabaseEntry;
  normalizedLabel: string;
};

const MAX_SEARCH_POOL = 80;
const SPLIT_LAYOUTS = new Set(["split", "aftermath"]);
const DFC_LAYOUTS = new Set(["transform", "modal_dfc"]);
const BASE_CARD_EXCLUDED_LAYOUTS = new Set(["art_series", "token"]);
const FACE_DIVIDER = " // ";
const FUSE_REMINDER_PATTERN =
  /(?:^|\n)Fuse \(You may cast one or both halves of this card from your hand\.\)\s*/i;
const LOYALTY_ABILITY_PATTERN = /^([+−-]?\d+|0):\s*(.+)$/;
const SHORT_FUZZY_TOKEN_LENGTH = 3;

const searchableBaseCards = rawDatabase.cards.filter(isSearchableBaseCard);
const searchCandidates = buildSearchCandidates(searchableBaseCards);

export function getCardDatabaseMetadata(): CardDatabaseMetadata {
  return {
    source: rawDatabase.source,
    sourceUri: rawDatabase.sourceUri,
    downloadUri: rawDatabase.downloadUri,
    updatedAt: rawDatabase.updatedAt,
    generatedAt: rawDatabase.generatedAt,
    cardCount: searchableBaseCards.length,
  };
}

export function searchCardDatabase(query: string, limit = 8): CardDatabaseEntry[] {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  const seen = new Set<string>();
  const scored = searchCandidates
    .map((candidate, index) => ({
      entry: candidate.entry,
      index,
      score: scoreCandidate(normalizedQuery, candidate.normalizedLabel),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index);
  const results: CardDatabaseEntry[] = [];

  for (const candidate of scored.slice(0, MAX_SEARCH_POOL)) {
    if (seen.has(candidate.entry.id)) {
      continue;
    }

    seen.add(candidate.entry.id);
    results.push(candidate.entry);

    if (results.length >= limit) {
      break;
    }
  }

  return results;
}

export function getCardDatabaseEntryPrimaryFace(entry: CardDatabaseEntry): CardDatabaseFace {
  return entry.faces[0] ?? entry;
}

export function buildCardPatchFromDatabaseEntry(entry: CardDatabaseEntry): Partial<CardDraft> {
  if (entry.layout === "adventure" && entry.faces.length >= 2) {
    const creatureFace = entry.faces[0];
    const adventureFace = entry.faces[1];

    return {
      baseCardName: entry.name,
      manaCost: creatureFace.manaCost,
      typeLine: creatureFace.typeLine,
      rulesText: creatureFace.oracleText,
      adventureName: adventureFace.name,
      adventureManaCost: adventureFace.manaCost,
      adventureTypeLine: adventureFace.typeLine,
      adventureRulesText: adventureFace.oracleText,
      power: creatureFace.power,
      toughness: creatureFace.toughness,
      typeFrame: "adventure",
    };
  }

  if (isSplitDatabaseEntry(entry)) {
    const layout = getSplitLayoutFromDatabaseEntry(entry);
    const leftFace = entry.faces[0] ?? entry;
    const rightFace = entry.faces[1] ?? entry;
    const fuseText = getFuseReminderText(leftFace.oracleText) || getFuseReminderText(rightFace.oracleText);

    return {
      baseCardName: entry.name,
      manaCost: "",
      typeLine: `${leftFace.typeLine}${FACE_DIVIDER}${rightFace.typeLine}`,
      rulesText: "",
      flavorText: "",
      power: "",
      toughness: "",
      typeFrame: layout,
      splitLayout: layout,
      splitLeft: {
        name: leftFace.name,
        manaCost: leftFace.manaCost,
        typeLine: leftFace.typeLine,
        rulesText: stripFuseReminderText(leftFace.oracleText),
        flavorText: "",
      },
      splitRight: {
        name: rightFace.name,
        manaCost: rightFace.manaCost,
        typeLine: rightFace.typeLine,
        rulesText: stripFuseReminderText(rightFace.oracleText),
        flavorText: "",
      },
      splitFuseText: layout === "fuse" ? fuseText : "",
    };
  }

  if (DFC_LAYOUTS.has(entry.layout) && entry.faces.length >= 2) {
    const frontFace = entry.faces[0];
    const backFace = entry.faces[1];
    const frontTypeFrame = inferTypeFrame(frontFace.typeLine);
    const isBattle = frontTypeFrame === "battle";

    return {
      baseCardName: entry.name,
      manaCost: frontFace.manaCost,
      typeLine: frontFace.typeLine,
      rulesText: frontFace.oracleText,
      power: frontFace.power,
      toughness: frontFace.toughness,
      defense: frontFace.defense,
      startingLoyalty: frontFace.loyalty,
      loyaltyAbilities: parseLoyaltyAbilities(frontFace.oracleText),
      backBaseCardName: entry.name,
      backName: backFace.name,
      backManaCost: backFace.manaCost,
      backTypeLine: backFace.typeLine,
      backRulesText: backFace.oracleText,
      backPower: backFace.power,
      backToughness: backFace.toughness,
      dfcFace: "front",
      dfcMode: entry.layout === "modal_dfc" ? "modal" : "transform",
      typeFrame: isBattle ? "battle" : "dfc",
    };
  }

  const face = getCardDatabaseEntryPrimaryFace(entry);
  const typeFrame = inferTypeFrame(face.typeLine);
  const loyaltyAbilities = parseLoyaltyAbilities(face.oracleText);

  return {
    baseCardName: entry.name,
    manaCost: face.manaCost,
    typeLine: face.typeLine,
    rulesText: getRulesTextForTypeFrame(face, typeFrame),
    power: typeFrame === "planeswalker" || typeFrame === "battle" ? "" : face.power,
    toughness: typeFrame === "planeswalker" || typeFrame === "battle" ? "" : face.toughness,
    defense: face.defense,
    startingLoyalty: face.loyalty,
    loyaltyAbilities,
    typeFrame: typeFrame === "standard" ? undefined : typeFrame,
  };
}

function buildSearchCandidates(cards: CardDatabaseEntry[]): SearchCandidate[] {
  return cards.flatMap((entry) => {
    const candidates: SearchCandidate[] = [
      {
        entry,
        normalizedLabel: normalizeSearchText(entry.name),
      },
    ];

    for (const face of entry.faces) {
      if (face.name && face.name !== entry.name) {
        candidates.push({
          entry,
          normalizedLabel: normalizeSearchText(face.name),
        });
      }
    }

    return candidates;
  });
}

function isSearchableBaseCard(entry: CardDatabaseEntry): boolean {
  return !BASE_CARD_EXCLUDED_LAYOUTS.has(entry.layout);
}

function scoreCandidate(normalizedQuery: string, normalizedLabel: string): number {
  if (!normalizedLabel) {
    return 0;
  }

  if (normalizedLabel === normalizedQuery) {
    return 1000;
  }

  if (normalizedLabel.startsWith(normalizedQuery)) {
    return 900 - normalizedLabel.length / 100;
  }

  if (hasWordPrefix(normalizedLabel, normalizedQuery)) {
    return 780 - normalizedLabel.length / 100;
  }

  if (normalizedLabel.includes(normalizedQuery)) {
    return 620 - normalizedLabel.length / 100;
  }

  const queryParts = normalizedQuery.split(" ").filter(Boolean);

  if (queryParts.length > 1 && queryParts.every((part) => normalizedLabel.includes(part))) {
    return 480 - normalizedLabel.length / 100;
  }

  const fuzzyScore = scoreFuzzyTokenMatch(queryParts, normalizedLabel);

  if (fuzzyScore > 0) {
    return fuzzyScore - normalizedLabel.length / 100;
  }

  return 0;
}

function hasWordPrefix(normalizedLabel: string, normalizedQuery: string): boolean {
  return normalizedLabel
    .split(" ")
    .some((word) => word.startsWith(normalizedQuery));
}

function scoreFuzzyTokenMatch(queryParts: string[], normalizedLabel: string): number {
  if (queryParts.length === 0 || queryParts.some((part) => part.length < SHORT_FUZZY_TOKEN_LENGTH)) {
    return 0;
  }

  const labelParts = normalizedLabel.split(" ").filter(Boolean);
  let totalSimilarity = 0;

  for (const queryPart of queryParts) {
    const similarity = getBestTokenSimilarity(queryPart, labelParts);

    if (similarity <= 0) {
      return 0;
    }

    totalSimilarity += similarity;
  }

  const averageSimilarity = totalSimilarity / queryParts.length;
  const coverageBonus = Math.min(queryParts.length, 4) * 18;

  return 330 + averageSimilarity * 120 + coverageBonus;
}

function getBestTokenSimilarity(queryPart: string, labelParts: string[]): number {
  let bestSimilarity = 0;

  for (const labelPart of labelParts) {
    if (labelPart.length < SHORT_FUZZY_TOKEN_LENGTH) {
      continue;
    }

    if (labelPart.startsWith(queryPart) || queryPart.startsWith(labelPart)) {
      bestSimilarity = Math.max(bestSimilarity, 0.92);
      continue;
    }

    const maxDistance = getMaxFuzzyDistance(queryPart, labelPart);
    const distance = damerauLevenshteinDistance(queryPart, labelPart, maxDistance);

    if (distance <= maxDistance) {
      bestSimilarity = Math.max(bestSimilarity, 1 - distance / Math.max(queryPart.length, labelPart.length));
    }
  }

  return bestSimilarity >= 0.64 ? bestSimilarity : 0;
}

function getMaxFuzzyDistance(queryPart: string, labelPart: string): number {
  const tokenLength = Math.max(queryPart.length, labelPart.length);
  const lengthDelta = Math.abs(queryPart.length - labelPart.length);

  if (tokenLength <= 4) {
    return lengthDelta > 1 ? 0 : 1;
  }

  if (tokenLength <= 7) {
    return lengthDelta > 2 ? 0 : 2;
  }

  return lengthDelta > 3 ? 0 : 3;
}

function damerauLevenshteinDistance(left: string, right: string, maxDistance: number): number {
  if (left === right) {
    return 0;
  }

  if (Math.abs(left.length - right.length) > maxDistance) {
    return maxDistance + 1;
  }

  let previousPreviousRow: number[] = [];
  let previousRow = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const currentRow = [leftIndex];
    let rowMinimum = currentRow[0];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      let distance = Math.min(
        previousRow[rightIndex] + 1,
        currentRow[rightIndex - 1] + 1,
        previousRow[rightIndex - 1] + substitutionCost,
      );

      if (
        leftIndex > 1 &&
        rightIndex > 1 &&
        left[leftIndex - 1] === right[rightIndex - 2] &&
        left[leftIndex - 2] === right[rightIndex - 1]
      ) {
        distance = Math.min(distance, previousPreviousRow[rightIndex - 2] + 1);
      }

      currentRow[rightIndex] = distance;
      rowMinimum = Math.min(rowMinimum, distance);
    }

    if (rowMinimum > maxDistance) {
      return maxDistance + 1;
    }

    previousPreviousRow = previousRow;
    previousRow = currentRow;
  }

  return previousRow[right.length];
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isSplitDatabaseEntry(entry: CardDatabaseEntry): boolean {
  return SPLIT_LAYOUTS.has(entry.layout) || entry.faces.some((face) => FUSE_REMINDER_PATTERN.test(face.oracleText));
}

function getSplitLayoutFromDatabaseEntry(entry: CardDatabaseEntry): SplitCardLayout {
  if (entry.layout === "aftermath") {
    return "aftermath";
  }

  if (entry.faces.some((face) => FUSE_REMINDER_PATTERN.test(face.oracleText))) {
    return "fuse";
  }

  return "split";
}

function getFuseReminderText(oracleText: string): string {
  return oracleText.match(FUSE_REMINDER_PATTERN)?.[0].trim() ?? "";
}

function stripFuseReminderText(oracleText: string): string {
  return oracleText.replace(FUSE_REMINDER_PATTERN, "").trim();
}

function inferTypeFrame(typeLine: string): TypeFrame | "standard" {
  const normalizedTypeLine = typeLine.toLowerCase();

  if (normalizedTypeLine.includes("battle")) {
    return "battle";
  }

  if (normalizedTypeLine.includes("planeswalker")) {
    return "planeswalker";
  }

  if (normalizedTypeLine.includes("enchantment") && normalizedTypeLine.includes("saga")) {
    return "saga";
  }

  if (normalizedTypeLine.includes("token")) {
    return "token";
  }

  return "standard";
}

function getRulesTextForTypeFrame(face: CardDatabaseFace, typeFrame: TypeFrame | "standard"): string {
  if (typeFrame !== "battle") {
    return face.oracleText;
  }

  return face.oracleText || DEFAULT_BATTLE_SIEGE_REMINDER;
}

function parseLoyaltyAbilities(oracleText: string): PlaneswalkerLoyaltyAbility[] | undefined {
  const abilities = oracleText
    .split("\n")
    .map((line, index) => {
      const match = line.match(LOYALTY_ABILITY_PATTERN);

      if (!match) {
        return null;
      }

      return {
        id: `oracle-loyalty-${index}`,
        cost: match[1].replace("−", "-"),
        text: match[2],
      };
    })
    .filter((ability): ability is PlaneswalkerLoyaltyAbility => ability !== null);

  return abilities.length > 0 ? abilities : undefined;
}
