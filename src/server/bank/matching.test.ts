import { describe, expect, it } from "vitest";
import { applyToContext, matchTransaction, type MatchContext, type OpenCharge } from "./matching";

const charge = (
  id: string,
  leaseId: string,
  dueDate: string,
  type: string,
  amount: number,
  paid = 0,
): OpenCharge => ({
  id,
  leaseId,
  dueDate,
  type,
  amount,
  paid,
});

function ctx(): MatchContext {
  return {
    leaseIdByVs: new Map([["2025001", "L1"]]),
    leaseIdByCounterAccount: new Map([["111/0100", "L1"]]),
    monthlyDueByLease: new Map([["L1", 2_170_000]]),
    openChargesByLease: new Map([
      [
        "L1",
        [
          charge("nov-svc", "L1", "2026-11-15", "service_charge", 320_000),
          charge("nov-rent", "L1", "2026-11-15", "rent", 1_850_000),
          charge("oct-rent", "L1", "2026-10-15", "rent", 1_850_000, 1_000_000),
        ],
      ],
    ]),
  };
}

describe("matchTransaction", () => {
  it("pays the oldest charge first, rent before service charges", () => {
    const r = matchTransaction(
      { amount: 1_200_000, variableSymbol: "2025001", counterAccount: null },
      ctx(),
    );
    expect(r.status).toBe("partial");
    expect(r.allocations).toEqual([
      { chargeId: "oct-rent", amount: 850_000 },
      { chargeId: "nov-rent", amount: 350_000 },
    ]);
  });

  it("is matched when the amount covers charges exactly", () => {
    const r = matchTransaction(
      { amount: 3_020_000, variableSymbol: "2025001", counterAccount: null },
      ctx(),
    );
    expect(r.status).toBe("matched");
    expect(r.leftover).toBe(0);
  });

  it("flags overpayments and keeps the leftover", () => {
    const r = matchTransaction(
      { amount: 3_120_000, variableSymbol: "2025001", counterAccount: null },
      ctx(),
    );
    expect(r.status).toBe("overpaid");
    expect(r.leftover).toBe(100_000);
  });

  it("treats a payment with nothing owed as overpaid", () => {
    const c = ctx();
    c.openChargesByLease.set("L1", []);
    const r = matchTransaction(
      { amount: 500_000, variableSymbol: "2025001", counterAccount: null },
      c,
    );
    expect(r).toMatchObject({
      status: "overpaid",
      leaseId: "L1",
      allocations: [],
      leftover: 500_000,
    });
  });

  it("matches by known counter account only when the amount is the usual monthly total", () => {
    const usual = matchTransaction(
      { amount: 2_170_000, variableSymbol: null, counterAccount: "111/0100" },
      ctx(),
    );
    expect(usual).toMatchObject({ leaseId: "L1" });
    expect(usual.reason).toMatch(/Known account/);
    const odd = matchTransaction(
      { amount: 1_000_000, variableSymbol: null, counterAccount: "111/0100" },
      ctx(),
    );
    expect(odd.status).toBe("needs_review");
  });

  it("sends unknown variable symbols to review", () => {
    const r = matchTransaction(
      { amount: 1_000_000, variableSymbol: "9999999", counterAccount: null },
      ctx(),
    );
    expect(r).toMatchObject({
      status: "needs_review",
      leaseId: null,
      reason: "Unknown variable symbol",
    });
  });

  it("ignores outgoing payments", () => {
    expect(
      matchTransaction({ amount: -245_050, variableSymbol: null, counterAccount: null }, ctx())
        .status,
    ).toBe("unmatched");
  });

  it("does not allocate the same debt twice across transactions", () => {
    const c = ctx();
    const first = matchTransaction(
      { amount: 3_020_000, variableSymbol: "2025001", counterAccount: null },
      c,
    );
    applyToContext(c, first);
    const second = matchTransaction(
      { amount: 1_000, variableSymbol: "2025001", counterAccount: null },
      c,
    );
    expect(second).toMatchObject({ status: "overpaid", allocations: [] });
  });
});
