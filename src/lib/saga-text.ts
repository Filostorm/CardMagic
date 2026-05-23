const SAGA_CHAPTER_LABELS = ["I", "II", "III", "IV", "V", "VI"] as const;
const SAGA_CHAPTER_PREFIX_PATTERN =
  /^((?:VI|IV|III|II|V|I)(?:\s*(?:,|-|–|—|\s)\s*(?:VI|IV|III|II|V|I))*)\s*[—–-]/i;
const SAGA_CHAPTER_TOKEN_PATTERN = /\b(?:VI|IV|III|II|V|I)\b/g;
const DOUBLE_LINE_BREAK_PATTERN = /\n{2,}/g;

export function normalizeSagaChapterBreaks(rulesText: string): string {
  const normalizedRulesText = rulesText.replace(/\r\n?/g, "\n");

  return normalizedRulesText.replace(DOUBLE_LINE_BREAK_PATTERN, (breakText, offset) => {
    const followingText = normalizedRulesText.slice(offset + breakText.length).trimStart();

    if (SAGA_CHAPTER_PREFIX_PATTERN.test(followingText)) {
      return "\n";
    }

    const previousText = normalizedRulesText.slice(0, offset);
    const nextChapter = getNextSagaChapterLabel(previousText);

    return `\n${nextChapter} — `;
  });
}

function getNextSagaChapterLabel(rulesText: string): string {
  const usedChapterIndexes = new Set<number>();

  for (const match of rulesText.matchAll(/^((?:VI|IV|III|II|V|I)(?:\s*(?:,|-|–|—|\s)\s*(?:VI|IV|III|II|V|I))*)\s*[—–-]/gim)) {
    match[1]
      .toUpperCase()
      .match(SAGA_CHAPTER_TOKEN_PATTERN)
      ?.forEach((chapterLabel) => {
        const chapterIndex = SAGA_CHAPTER_LABELS.indexOf(
          chapterLabel as (typeof SAGA_CHAPTER_LABELS)[number],
        );

        if (chapterIndex >= 0) {
          usedChapterIndexes.add(chapterIndex);
        }
      });
  }

  return SAGA_CHAPTER_LABELS.find((_, chapterIndex) => !usedChapterIndexes.has(chapterIndex)) ?? "VI";
}
