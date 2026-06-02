const rawSearchIndex = require("../../assets/card-data/scryfall-oracle-card-search-index.compact.json") as CardDatabaseSearchFile;

export type CardDatabaseSearchEntry = {
  id: string;
  name: string;
  layout: string;
  typeLine: string;
  labels: string[];
};

export type CardDatabaseSearchMetadata = {
  source: string;
  sourceUri: string;
  downloadUri: string;
  updatedAt: string;
  generatedAt: string;
  cardCount: number;
};

type CardDatabaseSearchTuple = [string, string, string, string, string[]];

type CardDatabaseSearchFile = CardDatabaseSearchMetadata & {
  cards: CardDatabaseSearchTuple[];
};

type ScoredSearchCandidate = {
  entry: CardDatabaseSearchEntry;
  index: number;
  score: number;
};

const MAX_SEARCH_POOL = 80;
const SHORT_FUZZY_TOKEN_LENGTH = 3;

const searchEntries = rawSearchIndex.cards.map(toSearchEntry);
const searchCandidates = searchEntries.flatMap((entry) =>
  entry.labels.map((normalizedLabel) => ({
    entry,
    normalizedLabel,
  })),
);

export function getCardDatabaseSearchMetadata(): CardDatabaseSearchMetadata {
  return {
    source: rawSearchIndex.source,
    sourceUri: rawSearchIndex.sourceUri,
    downloadUri: rawSearchIndex.downloadUri,
    updatedAt: rawSearchIndex.updatedAt,
    generatedAt: rawSearchIndex.generatedAt,
    cardCount: rawSearchIndex.cardCount,
  };
}

export function searchCardDatabaseIndex(query: string, limit = 8): CardDatabaseSearchEntry[] {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  const bestByCardId = new Map<string, ScoredSearchCandidate>();

  for (let index = 0; index < searchCandidates.length; index += 1) {
    const candidate = searchCandidates[index];
    const score = scoreCandidate(normalizedQuery, candidate.normalizedLabel);

    if (score <= 0) {
      continue;
    }

    const scoredCandidate = {
      entry: candidate.entry,
      index,
      score,
    };
    const existingCandidate = bestByCardId.get(candidate.entry.id);

    if (!existingCandidate || isScoredSearchCandidateBefore(scoredCandidate, existingCandidate)) {
      bestByCardId.set(candidate.entry.id, scoredCandidate);
    }
  }

  const topCandidates: ScoredSearchCandidate[] = [];
  const poolLimit = Math.max(limit, MAX_SEARCH_POOL);

  for (const candidate of bestByCardId.values()) {
    insertTopSearchCandidate(topCandidates, candidate, poolLimit);
  }

  return topCandidates.slice(0, limit).map((candidate) => candidate.entry);
}

function toSearchEntry([id, name, layout, typeLine, labels]: CardDatabaseSearchTuple): CardDatabaseSearchEntry {
  return {
    id,
    name,
    layout,
    typeLine,
    labels,
  };
}

function insertTopSearchCandidate(
  pool: ScoredSearchCandidate[],
  candidate: ScoredSearchCandidate,
  limit: number,
) {
  if (pool.length >= limit && !isScoredSearchCandidateBefore(candidate, pool[pool.length - 1])) {
    return;
  }

  const insertAt = pool.findIndex((existingCandidate) =>
    isScoredSearchCandidateBefore(candidate, existingCandidate),
  );

  pool.splice(insertAt === -1 ? pool.length : insertAt, 0, candidate);

  if (pool.length > limit) {
    pool.pop();
  }
}

function isScoredSearchCandidateBefore(
  left: ScoredSearchCandidate,
  right: ScoredSearchCandidate,
) {
  return left.score > right.score || (left.score === right.score && left.index < right.index);
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
