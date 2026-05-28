export function resolveRulesTextCardNameToken(rulesText: string, cardName?: string): string {
  const resolvedName = cardName?.trim();

  if (!resolvedName) {
    return rulesText;
  }

  return rulesText.replace(/\bNAME\b/g, resolvedName);
}
