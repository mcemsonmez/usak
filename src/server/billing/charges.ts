// Pure charge calculation. No DB access, so it is easy to test.
// Money is integer minor units (haléř). Prorated amounts are rounded to whole CZK.

export type BillableLease = {
  id: string;
  status: "draft" | "active" | "ended";
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
  rentAmount: number;
  serviceChargeAmount: number;
  dueDay: number;
};

export type ChargeDraft = {
  leaseId: string;
  period: string; // YYYY-MM
  type: "rent" | "service_charge";
  amount: number;
  dueDate: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function isPeriod(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function daysInMonth(period: string): number {
  const [y, m] = period.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function periodBounds(period: string): { start: string; end: string } {
  return { start: `${period}-01`, end: `${period}-${pad(daysInMonth(period))}` };
}

export function periodOf(date: string): string {
  return date.slice(0, 7);
}

export function shiftPeriod(period: string, months: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** Share of the month the lease covers, as [activeDays, daysInMonth]. Null if not active. */
export function coverage(lease: BillableLease, period: string): [number, number] | null {
  const { start, end } = periodBounds(period);
  const from = lease.startDate > start ? lease.startDate : start;
  const to = lease.endDate && lease.endDate < end ? lease.endDate : end;
  if (from > to) return null;
  return [dayDiff(from, to) + 1, daysInMonth(period)];
}

export function prorate(amount: number, activeDays: number, totalDays: number): number {
  if (activeDays >= totalDays) return amount;
  return Math.round((amount * activeDays) / totalDays / 100) * 100;
}

/** Charges a lease should have for one month. Draft leases are never billed. */
export function chargesForPeriod(lease: BillableLease, period: string): ChargeDraft[] {
  if (lease.status === "draft") return [];
  const cov = coverage(lease, period);
  if (!cov) return [];
  const [activeDays, totalDays] = cov;

  let dueDate = `${period}-${pad(Math.min(lease.dueDay, totalDays))}`;
  if (dueDate < lease.startDate) dueDate = lease.startDate; // first month starts after the due day

  const drafts: ChargeDraft[] = [];
  const rent = prorate(lease.rentAmount, activeDays, totalDays);
  const service = prorate(lease.serviceChargeAmount, activeDays, totalDays);
  if (rent > 0) drafts.push({ leaseId: lease.id, period, type: "rent", amount: rent, dueDate });
  if (service > 0)
    drafts.push({ leaseId: lease.id, period, type: "service_charge", amount: service, dueDate });
  return drafts;
}
