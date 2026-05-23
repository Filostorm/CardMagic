import { CardDraft, CardKeyword } from "@/types/card";

export function formatKeywordLine(keyword: CardKeyword): string {
  const name = keyword.name.trim();

  if (!name) {
    return "";
  }

  const reminderText = keyword.reminderText?.trim();
  const reminder = keyword.showReminder && reminderText ? ` (${reminderText})` : "";

  if (keyword.category === "abilityWord" && !reminder) {
    return `${name} —`;
  }

  return `${name}${reminder}`;
}

export function getKeywordRulesText(keywords?: CardKeyword[]): string {
  return (keywords ?? [])
    .map(formatKeywordLine)
    .filter(Boolean)
    .join("\n");
}

export function getDisplayRulesText(
  card: Pick<CardDraft, "keywords" | "rulesText">,
): string {
  return [getKeywordRulesText(card.keywords), normalizeManualRulesText(card.rulesText)]
    .filter(Boolean)
    .join("\n");
}

function normalizeManualRulesText(rulesText: string): string {
  const normalizedRulesText = rulesText
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+$/gm, "");

  return normalizedRulesText.trim().length > 0 ? normalizedRulesText : "";
}
