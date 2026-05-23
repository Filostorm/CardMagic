import {
  TYPE_LINE_AUTOCOMPLETE_ENTRIES,
  TypeLineAutocompleteEntry,
} from "@/data/type-line-autocomplete";

export type TypeLineAutocompleteSuggestion = TypeLineAutocompleteEntry & {
  replacement: string;
};

const TYPE_LINE_WORD_CHAR_PATTERN = /[A-Za-z.'-]/;
const TYPE_LINE_DIVIDER_PATTERN = /\s+[—–-]\s+/;
const MAX_TYPE_LINE_SUGGESTIONS = 6;

const CATEGORY_WEIGHT: Record<TypeLineAutocompleteEntry["category"], number> = {
  supertype: 0,
  cardType: 1,
  subtype: 2,
};

const CARD_TYPE_SUBTYPE_DETAILS: Record<string, string[]> = {
  Artifact: ["Artifact"],
  Battle: ["Battle"],
  Creature: ["Creature"],
  Enchantment: ["Enchantment"],
  Instant: ["Spell"],
  Kindred: ["Creature"],
  Land: ["Land"],
  Planeswalker: ["Planeswalker"],
  Sorcery: ["Spell"],
};
const SUBTYPE_WORDS = TYPE_LINE_AUTOCOMPLETE_ENTRIES
  .filter((entry) => entry.category === "subtype")
  .map((entry) => entry.value.split(/\s+/).length);
const MAX_SUBTYPE_WORD_COUNT = Math.max(1, ...SUBTYPE_WORDS);
const SUBTYPE_DETAILS_BY_VALUE = TYPE_LINE_AUTOCOMPLETE_ENTRIES.reduce((detailsByValue, entry) => {
  if (entry.category !== "subtype" || !entry.detail) {
    return detailsByValue;
  }

  const normalizedValue = normalizeAutocompleteText(entry.value);
  const details = detailsByValue.get(normalizedValue) ?? new Set<string>();

  details.add(entry.detail);
  detailsByValue.set(normalizedValue, details);

  return detailsByValue;
}, new Map<string, Set<string>>());

export function getTypeLineAutocompleteSuggestions(
  typeLine: string,
  cursorIndex = typeLine.length,
): TypeLineAutocompleteSuggestion[] {
  const token = getCurrentTypeLineToken(typeLine, cursorIndex);

  if (!token || token.text.length < 1) {
    return [];
  }

  const normalizedToken = normalizeAutocompleteText(token.text);
  const context = getTypeLineAutocompleteContext(typeLine, token.start);
  const existingWords = new Set(
    parseTypeLineWords(typeLine)
      .map(normalizeAutocompleteText)
      .filter((word) => word !== normalizedToken),
  );

  return TYPE_LINE_AUTOCOMPLETE_ENTRIES
    .filter((entry) => isEntryAllowedForContext(entry, context))
    .filter((entry) => {
      const normalizedValue = normalizeAutocompleteText(entry.value);

      return (
        normalizedValue !== normalizedToken &&
        normalizedValue.startsWith(normalizedToken) &&
        !existingWords.has(normalizedValue)
      );
    })
    .sort((first, second) => {
      const firstExact = normalizeAutocompleteText(first.value) === normalizedToken ? -1 : 0;
      const secondExact = normalizeAutocompleteText(second.value) === normalizedToken ? -1 : 0;

      return (
        firstExact - secondExact ||
        CATEGORY_WEIGHT[first.category] - CATEGORY_WEIGHT[second.category] ||
        first.value.length - second.value.length ||
        first.value.localeCompare(second.value)
      );
    })
    .slice(0, MAX_TYPE_LINE_SUGGESTIONS)
    .map((entry) => ({
      ...entry,
      replacement: replaceCurrentTypeLineToken(typeLine, token, entry.value),
    }));
}

export function filterCompatibleSubtypeText(typeWords: string[], subtypeText: string): string {
  const allowedSubtypeDetails = getSubtypeDetailsForTypeWords(typeWords);
  const words = subtypeText.trim().split(/\s+/).filter(Boolean);
  const compatibleSubtypes: string[] = [];
  let wordIndex = 0;

  while (wordIndex < words.length) {
    let matched = false;
    const maxWordCount = Math.min(MAX_SUBTYPE_WORD_COUNT, words.length - wordIndex);

    for (let wordCount = maxWordCount; wordCount >= 1; wordCount -= 1) {
      const candidateWords = words.slice(wordIndex, wordIndex + wordCount);
      const normalizedCandidate = normalizeAutocompleteText(candidateWords.join(" "));
      const subtypeDetails = SUBTYPE_DETAILS_BY_VALUE.get(normalizedCandidate);

      if (!subtypeDetails) {
        continue;
      }

      if (hasCompatibleSubtypeDetail(subtypeDetails, allowedSubtypeDetails)) {
        compatibleSubtypes.push(candidateWords.join(" "));
      }

      wordIndex += wordCount;
      matched = true;
      break;
    }

    if (!matched) {
      compatibleSubtypes.push(words[wordIndex]);
      wordIndex += 1;
    }
  }

  return compatibleSubtypes.join(" ");
}

function getSubtypeDetailsForTypeWords(typeWords: string[]): Set<string> {
  const subtypeDetails = new Set<string>();

  for (const typeWord of typeWords.map(normalizeTypeWord)) {
    for (const detail of CARD_TYPE_SUBTYPE_DETAILS[typeWord] ?? []) {
      subtypeDetails.add(detail);
    }
  }

  return subtypeDetails;
}

function hasCompatibleSubtypeDetail(
  subtypeDetails: Set<string>,
  allowedSubtypeDetails: Set<string>,
): boolean {
  for (const subtypeDetail of subtypeDetails) {
    if (allowedSubtypeDetails.has(subtypeDetail)) {
      return true;
    }
  }

  return false;
}

function getTypeLineAutocompleteContext(
  typeLine: string,
  tokenStart: number,
): { inSubtypeSection: boolean; subtypeDetails: Set<string> } {
  const dividerMatch = TYPE_LINE_DIVIDER_PATTERN.exec(typeLine);
  const typeText = dividerMatch ? typeLine.slice(0, dividerMatch.index) : typeLine;
  const inSubtypeSection = Boolean(dividerMatch && tokenStart > dividerMatch.index);
  const typeWords = typeText.split(/\s+/).filter(Boolean).map(normalizeTypeWord);
  const subtypeDetails = getSubtypeDetailsForTypeWords(typeWords);

  return { inSubtypeSection, subtypeDetails };
}

function isEntryAllowedForContext(
  entry: TypeLineAutocompleteEntry,
  context: { inSubtypeSection: boolean; subtypeDetails: Set<string> },
): boolean {
  if (!context.inSubtypeSection) {
    return entry.category === "supertype" || entry.category === "cardType";
  }

  if (entry.category !== "subtype") {
    return false;
  }

  return Boolean(entry.detail && context.subtypeDetails.has(entry.detail));
}

type TypeLineToken = {
  text: string;
  start: number;
  end: number;
};

function getCurrentTypeLineToken(typeLine: string, cursorIndex: number): TypeLineToken | null {
  const boundedCursorIndex = Math.max(0, Math.min(typeLine.length, cursorIndex));
  let start = boundedCursorIndex;
  let end = boundedCursorIndex;

  while (start > 0 && TYPE_LINE_WORD_CHAR_PATTERN.test(typeLine[start - 1])) {
    start -= 1;
  }

  while (end < typeLine.length && TYPE_LINE_WORD_CHAR_PATTERN.test(typeLine[end])) {
    end += 1;
  }

  const text = typeLine.slice(start, end);

  if (!text || !/[A-Za-z]/.test(text)) {
    return null;
  }

  return {
    text,
    start,
    end,
  };
}

function replaceCurrentTypeLineToken(
  typeLine: string,
  token: TypeLineToken,
  value: string,
): string {
  return `${typeLine.slice(0, token.start)}${value}${typeLine.slice(token.end)}`;
}

function parseTypeLineWords(typeLine: string): string[] {
  return typeLine
    .split(TYPE_LINE_DIVIDER_PATTERN)
    .flatMap((section) => section.split(/\s+/))
    .filter(Boolean);
}

function normalizeAutocompleteText(value: string): string {
  return value.toLowerCase().replace(/[.'-]/g, "");
}

function normalizeTypeWord(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
