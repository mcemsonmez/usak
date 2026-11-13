import { formatMoney } from "@/lib/money";
import { formatPeriod } from "@/lib/periods";
import type { ReminderLevel } from "./debtors";

export type ReminderDraft = { sent: false; subject: string; body: string; note: string };

const openers: Record<Exclude<ReminderLevel, "none">, (name: string) => string> = {
  polite: (n) =>
    `Dear ${n},\n\nthis is a friendly reminder that we have not yet received your payment.`,
  serious: (n) =>
    `Dear ${n},\n\nyour payment is now more than 10 days overdue. Please pay as soon as possible.`,
  final: (n) =>
    `Dear ${n},\n\nthis is a final notice. Your payment is more than 20 days overdue. If it is not received within 7 days, we will have to take further steps.`,
};

/** Placeholder: email/SMS sending is not implemented. Returns the message that would be sent. */
export function reminderDraft(p: {
  tenantName: string;
  unit: string;
  overdue: number;
  periods: string[];
  variableSymbol: string;
  level: ReminderLevel;
}): ReminderDraft {
  const level = p.level === "none" ? "polite" : p.level;
  const subject =
    level === "final"
      ? `Final notice: overdue rent for ${p.unit}`
      : `Payment reminder for ${p.unit}`;
  const body = [
    openers[level](p.tenantName),
    "",
    `Amount due: ${formatMoney(p.overdue)} (${p.periods.map(formatPeriod).join(", ")})`,
    `Variable symbol: ${p.variableSymbol}`,
    "",
    "If you have already paid, please ignore this message.",
    "",
    "Kind regards,\nDemo Properties s.r.o.",
  ].join("\n");
  return { sent: false, subject, body, note: "Not sent: email sending is not implemented yet." };
}
