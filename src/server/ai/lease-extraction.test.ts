import { describe, expect, it } from "vitest";
import { guessTenantId, guessUnitId, parseLeaseExtraction } from "./lease-extraction";

describe("parseLeaseExtraction", () => {
  it("reads JSON inside code fences and normalises values", () => {
    const r = parseLeaseExtraction(`Here you go:
\`\`\`json
{"tenantName":"Martin Král","tenantEmail":"","startDate":"2026-12-01","endDate":null,
 "monthlyRent":"16 900 CZK","monthlyServiceCharges":2800,"deposit":"33,800.00","dueDay":"15","currency":"CZK"}
\`\`\``);
    expect(r).toMatchObject({
      tenantName: "Martin Král",
      tenantEmail: null,
      startDate: "2026-12-01",
      endDate: null,
      monthlyRent: 16900,
      monthlyServiceCharges: 2800,
      deposit: 33800,
      dueDay: 15,
      unitLabel: null,
    });
  });

  it("drops invalid dates instead of guessing", () => {
    expect(parseLeaseExtraction('{"startDate":"1 Dec 2026"}').startDate).toBeNull();
  });

  it("clamps due day to 28 and rejects nonsense", () => {
    expect(parseLeaseExtraction('{"dueDay":31}').dueDay).toBe(28);
    expect(parseLeaseExtraction('{"dueDay":0}').dueDay).toBeNull();
  });

  it("throws when there is no JSON", () => {
    expect(() => parseLeaseExtraction("Sorry, I cannot read this.")).toThrow(/did not return JSON/);
  });
});

describe("guessing records", () => {
  const units = [
    { id: "u1", label: "Loft C", propertyName: "Karlín Lofts", address: "Křižíkova 488/115" },
    { id: "u2", label: "Apt 3", propertyName: "Vinohrady Residence", address: "Mánesova 1442/28" },
  ];
  it("matches the unit by label, ignoring accents and case", () => {
    expect(
      guessUnitId(
        { unitLabel: "loft c", propertyName: null, propertyAddress: "Krizikova 488/115, Praha 8" },
        units,
      ),
    ).toBe("u1");
    expect(
      guessUnitId({ unitLabel: "Penthouse", propertyName: null, propertyAddress: null }, units),
    ).toBeNull();
  });
  it("matches an existing tenant by full name", () => {
    expect(guessTenantId("PETR SVOBODA", [{ id: "t1", fullName: "Petr Svoboda" }])).toBe("t1");
    expect(guessTenantId("Martin Král", [{ id: "t1", fullName: "Petr Svoboda" }])).toBeNull();
  });
});
