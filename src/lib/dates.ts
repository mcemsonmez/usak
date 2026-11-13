/** Today's calendar date in UTC as "YYYY-MM-DD". */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whole days from a to b ("YYYY-MM-DD"). Positive if b is later. */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
