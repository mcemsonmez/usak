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

describe("Fio export format", () => {
  const fio = [
    '"accountId";"2001987654"',
    '"bankId";"2010"',
    '"currency";"CZK"',
    '"openingBalance";"598731,40"',
    '"closingBalance";"620100,00"',
    '"dateStart";"01.11.2026"',
    '"dateEnd";"12.11.2026"',
    "",
    '"ID pohybu";"Datum";"Objem";"Měna";"Protiúčet";"Kód banky";"Název banky";"Název protiúčtu";"KS";"VS";"SS";"Zpráva pro příjemce";"Typ"',
    '"26000001";"03.11.2026";"21700,00";"CZK";"123456789";"0800";"Česká spořitelna, a.s.";"Jana Nováková";"0308";"2025001";"";"Najem 11/2026";"Bezhotovostní příjem"',
    '"26000002";"09.11.2026";"-2420,00";"CZK";"1234500987";"0100";"Komerční banka, a.s.";"Instalatérství Novák";"";"";"";"Faktura 2026-118";"Bezhotovostní platba"',
    '"26000003";"xx";"1,00";"CZK";"";"";"";"";"";"";"";"";""',
  ].join("\n");

  it("skips the account header and reads the statement info", () => {
    const { statement, transactions } = parseBankCsv(fio);
    expect(statement).toEqual({
      account: "2001987654/2010",
      currency: "CZK",
      from: "2026-11-01",
      to: "2026-11-12",
      openingBalance: 59_873_140,
      closingBalance: 62_010_000,
    });
    expect(transactions).toHaveLength(2);
  });

  it("joins the counter account with its bank code", () => {
    const [jana, invoice] = parseBankCsv(fio).transactions;
    expect(jana).toMatchObject({
      counterAccount: "123456789/0800",
      variableSymbol: "2025001",
      amount: 2_170_000,
    });
    expect(invoice).toMatchObject({ counterAccount: "1234500987/0100", amount: -242_000 });
  });

  it("reports errors with the real file line", () => {
    expect(parseBankCsv(fio).errors).toEqual([{ line: 12, message: 'Invalid date "xx"' }]);
  });

  it("uses the bank's movement id for duplicates", () => {
    const a = parseBankCsv(fio).transactions[0].importHash;
    const changedMessage = fio.replace("Najem 11/2026", "Najem listopad");
    expect(parseBankCsv(changedMessage).transactions[0].importHash).toBe(a);
  });
});
