import { describe, expect, it } from "vitest";
import { mapColumns, normalizeVs, parseBankCsv, parseDate, splitCsv } from "./csv";

describe("splitCsv", () => {
  it("detects semicolons and handles quotes", () => {
    expect(splitCsv('a;b;c\n1;"x; y";"say ""hi"""\n')).toEqual([
      ["a", "b", "c"],
      ["1", "x; y", 'say "hi"'],
    ]);
  });
  it("handles CRLF, BOM and blank lines", () => {
    expect(splitCsv("﻿a,b\r\n1,2\r\n\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("mapColumns", () => {
  it("recognises Czech bank headers", () => {
    expect(
      mapColumns(["Datum", "Objem", "Protiúčet", "Název protiúčtu", "VS", "Zpráva pro příjemce"]),
    ).toEqual({
      date: 0,
      amount: 1,
      counterAccount: 2,
      counterName: 3,
      variableSymbol: 4,
      message: 5,
    });
  });
});

describe("parseDate / normalizeVs", () => {
  it("parses ISO and Czech dates, rejects invalid ones", () => {
    expect(parseDate("2026-11-03")).toBe("2026-11-03");
    expect(parseDate("3.11.2026")).toBe("2026-11-03");
    expect(parseDate("03. 11. 2026")).toBe("2026-11-03");
    expect(parseDate("31.02.2026")).toBeNull();
  });
  it("strips leading zeros and non-digits", () => {
    expect(normalizeVs("0002025001")).toBe("2025001");
    expect(normalizeVs("")).toBeNull();
  });
});

describe("parseBankCsv", () => {
  const csv = [
    "Date;Amount;Counter account;Counter name;Variable symbol;Message",
    "03.11.2026;21 700,00;123456789/0800;Jana Nováková;2025001;Nájem 11/2026",
    "04.11.2026;-2 450,50;;;;Bank fee",
    "05.11.2026;abc;;;;",
    "06.11.2026;1000;;;;Same",
    "06.11.2026;1000;;;;Same",
  ].join("\n");

  it("parses amounts to minor units and reports bad rows with line numbers", () => {
    const { transactions, errors } = parseBankCsv(csv);
    expect(transactions[0]).toMatchObject({
      bookedOn: "2026-11-03",
      amount: 2_170_000,
      counterAccount: "123456789/0800",
      variableSymbol: "2025001",
    });
    expect(transactions[1].amount).toBe(-245_050);
    expect(errors).toEqual([{ line: 4, message: 'Invalid amount "abc"' }]);
  });

  it("gives identical rows in one file different hashes, and is stable across runs", () => {
    const a = parseBankCsv(csv).transactions;
    const b = parseBankCsv(csv).transactions;
    expect(a[2].importHash).not.toBe(a[3].importHash);
    expect(a.map((t) => t.importHash)).toEqual(b.map((t) => t.importHash));
  });

  it("reports missing required columns", () => {
    expect(parseBankCsv("Foo;Bar\n1;2").errors[0].message).toMatch(/Missing column/);
  });
});
