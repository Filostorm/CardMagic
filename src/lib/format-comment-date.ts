// Formats an ISO date string as a compact "Mon D" label (empty string for
// invalid dates). Shared by App.tsx and the community panel.
export function formatCompactCommentDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
