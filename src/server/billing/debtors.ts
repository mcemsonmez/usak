// Pure debtor calculation from charges + what has been paid on them.

export type ChargeWithPaid = {
  id: string;
  leaseId: string;
  period: string;
  dueDate: string;
  amount: number;
  paid: number;
};

export type ReminderLevel = "none" | "polite" | "serious" | "final";

export type Debtor = {
  leaseId: string;
  overdue: number; // minor units past due date
  oldestDueDate: string;
  daysOverdue: number;
  periods: string[];
  level: ReminderLevel;
};

const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/** Reminder escalation: due +3 days polite, +10 serious, +20 final notice. */
export function reminderLevel(daysOverdue: number): ReminderLevel {
  if (daysOverdue >= 20) return "final";
  if (daysOverdue >= 10) return "serious";
  if (daysOverdue >= 3) return "polite";
  return "none";
}

export function computeDebtors(charges: ChargeWithPaid[], today: string): Debtor[] {
  const byLease = new Map<string, Debtor>();
  for (const c of charges) {
    const unpaid = c.amount - c.paid;
    if (unpaid <= 0 || c.dueDate >= today) continue;
    const d = byLease.get(c.leaseId) ?? {
      leaseId: c.leaseId,
      overdue: 0,
      oldestDueDate: c.dueDate,
      daysOverdue: 0,
      periods: [],
      level: "none" as ReminderLevel,
    };
    d.overdue += unpaid;
    if (c.dueDate < d.oldestDueDate) d.oldestDueDate = c.dueDate;
    if (!d.periods.includes(c.period)) d.periods.push(c.period);
    byLease.set(c.leaseId, d);
  }
  return [...byLease.values()]
    .map((d) => {
      const daysOverdue = days(d.oldestDueDate, today);
      return { ...d, periods: d.periods.sort(), daysOverdue, level: reminderLevel(daysOverdue) };
    })
    .sort((a, b) => b.overdue - a.overdue);
}
