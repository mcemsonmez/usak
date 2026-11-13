import { daysBetween } from "./dates";

type LeaseDates = { status: string; startDate: string; endDate: string | null };

export type LeasePhase = "upcoming" | "current" | "ending_soon" | "ended";

export const ENDING_SOON_DAYS = 60;

export function leasePhase(l: LeaseDates, today: string): LeasePhase {
  if (l.status === "ended" || (l.endDate && l.endDate < today)) return "ended";
  if (l.startDate > today) return "upcoming";
  if (l.endDate && daysBetween(today, l.endDate) <= ENDING_SOON_DAYS) return "ending_soon";
  return "current";
}

/** The lease that is in effect today (or the next upcoming one) for a unit. */
export function currentLease<T extends LeaseDates>(leases: T[], today: string): T | undefined {
  const live = leases.filter((l) => leasePhase(l, today) !== "ended");
  return (
    live.find((l) => l.startDate <= today) ??
    live.sort((a, b) => (a.startDate < b.startDate ? -1 : 1))[0]
  );
}
