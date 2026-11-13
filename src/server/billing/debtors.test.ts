import { describe, expect, it } from "vitest";
import { type ChargeWithPaid, computeDebtors, reminderLevel } from "./debtors";

const c = (
  id: string,
  leaseId: string,
  dueDate: string,
  amount: number,
  paid = 0,
): ChargeWithPaid => ({
  id,
  leaseId,
  period: dueDate.slice(0, 7),
  dueDate,
  amount,
  paid,
});

describe("reminderLevel", () => {
  it("escalates at 3, 10 and 20 days", () => {
    expect([0, 2, 3, 9, 10, 19, 20, 60].map(reminderLevel)).toEqual([
      "none",
      "none",
      "polite",
      "polite",
      "serious",
      "serious",
      "final",
      "final",
    ]);
  });
});

describe("computeDebtors", () => {
  const today = "2026-11-13";

  it("sums unpaid amounts past their due date per lease, biggest first", () => {
    const debtors = computeDebtors(
      [
        c("a", "L1", "2026-10-15", 1_000_000, 400_000),
        c("b", "L1", "2026-11-05", 500_000),
        c("c", "L2", "2026-11-10", 2_000_000),
      ],
      today,
    );
    expect(debtors.map((d) => [d.leaseId, d.overdue])).toEqual([
      ["L2", 2_000_000],
      ["L1", 1_100_000],
    ]);
    expect(debtors[1]).toMatchObject({
      oldestDueDate: "2026-10-15",
      daysOverdue: 29,
      periods: ["2026-10", "2026-11"],
      level: "final",
    });
    expect(debtors[0]).toMatchObject({ daysOverdue: 3, level: "polite" });
  });

  it("ignores paid charges and charges not yet due (including due today)", () => {
    expect(
      computeDebtors(
        [
          c("a", "L1", "2026-10-15", 100, 100),
          c("b", "L1", "2026-11-13", 100),
          c("c", "L1", "2026-11-20", 100),
        ],
        today,
      ),
    ).toEqual([]);
  });
});
