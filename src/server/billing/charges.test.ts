import { describe, expect, it } from "vitest";
import {
  type BillableLease,
  chargesForPeriod,
  daysInMonth,
  isPeriod,
  prorate,
  shiftPeriod,
} from "./charges";

const base: BillableLease = {
  id: "L1",
  status: "active",
  startDate: "2025-01-01",
  endDate: null,
  rentAmount: 1_850_000, // 18 500 CZK
  serviceChargeAmount: 320_000, // 3 200 CZK
  dueDay: 15,
};

describe("period helpers", () => {
  it("knows month lengths, including leap years", () => {
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2028-02")).toBe(29);
    expect(daysInMonth("2026-11")).toBe(30);
  });
  it("shifts periods across years", () => {
    expect(shiftPeriod("2026-01", -1)).toBe("2025-12");
    expect(shiftPeriod("2026-12", 1)).toBe("2027-01");
  });
  it("validates periods", () => {
    expect(isPeriod("2026-11")).toBe(true);
    expect(isPeriod("2026-13")).toBe(false);
    expect(isPeriod("26-11")).toBe(false);
  });
});

describe("chargesForPeriod", () => {
  it("bills full rent and service charge for a full month", () => {
    expect(chargesForPeriod(base, "2026-11")).toEqual([
      { leaseId: "L1", period: "2026-11", type: "rent", amount: 1_850_000, dueDate: "2026-11-15" },
      {
        leaseId: "L1",
        period: "2026-11",
        type: "service_charge",
        amount: 320_000,
        dueDate: "2026-11-15",
      },
    ]);
  });

  it("prorates a lease that starts mid-month (10 Nov: 21 of 30 days)", () => {
    const lease = {
      ...base,
      startDate: "2026-11-10",
      rentAmount: 1_450_000,
      serviceChargeAmount: 250_000,
      dueDay: 10,
    };
    const [rent, service] = chargesForPeriod(lease, "2026-11");
    expect(rent.amount).toBe(1_015_000); // 14 500 * 21/30 = 10 150
    expect(service.amount).toBe(175_000); // 2 500 * 21/30 = 1 750
    expect(rent.dueDate).toBe("2026-11-10");
  });

  it("moves the due date to the start date when the lease starts after the due day", () => {
    const lease = { ...base, startDate: "2026-11-20", dueDay: 15 };
    expect(chargesForPeriod(lease, "2026-11")[0].dueDate).toBe("2026-11-20");
  });

  it("prorates a lease that ends mid-month", () => {
    const lease = { ...base, endDate: "2026-12-15" };
    expect(chargesForPeriod(lease, "2026-12")[0].amount).toBe(prorate(1_850_000, 15, 31));
  });

  it("rounds prorated amounts to whole CZK", () => {
    const amount = prorate(1_000_000, 1, 31); // 10 000 / 31 = 322.58
    expect(amount % 100).toBe(0);
    expect(amount).toBe(32_300);
  });

  it("bills nothing before the lease starts or after it ends", () => {
    expect(chargesForPeriod({ ...base, startDate: "2026-12-01" }, "2026-11")).toEqual([]);
    expect(chargesForPeriod({ ...base, endDate: "2026-10-31" }, "2026-11")).toEqual([]);
  });

  it("never bills draft leases", () => {
    expect(chargesForPeriod({ ...base, status: "draft" }, "2026-11")).toEqual([]);
  });

  it("clamps the due day to short months", () => {
    const lease = { ...base, dueDay: 28 };
    expect(chargesForPeriod(lease, "2026-02")[0].dueDate).toBe("2026-02-28");
  });

  it("skips a zero service charge", () => {
    const charges = chargesForPeriod({ ...base, serviceChargeAmount: 0 }, "2026-11");
    expect(charges.map((c) => c.type)).toEqual(["rent"]);
  });
});
