// Demo bank statements in the Fio banka CSV export format (account header, then the movements).
// Matches the seeded leases (variable symbols and payer accounts). Account numbers are made up.
import { daysInMonth } from "@/server/billing/charges";

export const LANDLORD_ACCOUNT = { number: "2001987654", bank: "2010" };

export const DEMO_ACCOUNTS = {
  jana: { name: "Jana Nováková", account: "123456789", bank: "0800", vs: "2025001" },
  petr: { name: "Petr Svoboda", account: "2400112233", bank: "2010", vs: "2024002" },
  tomas: { name: "Tomáš Černý", account: "19-2000145399", bank: "0800", vs: "2025004" },
  eva: { name: "Eva Procházková", account: "2001234567", bank: "2010", vs: "2026005" },
  kavarna: { name: "Kavárna Anděl s.r.o.", account: "2700456789", bank: "2010", vs: "2023006" },
} as const;

const BANK_NAMES: Record<string, string> = {
  "0800": "Česká spořitelna, a.s.",
  "2010": "Fio banka, a.s.",
  "0300": "Československá obchodní banka, a. s.",
  "0100": "Komerční banka, a.s.",
};

type Movement = {
  day: number;
  amount: number; // CZK, negative = outgoing
  account?: string;
  bank?: string;
  name?: string;
  vs?: string;
  message: string;
  type: string;
};

const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
const czAmount = (n: number) => n.toFixed(2).replace(".", ",");
const czDate = (period: string, day: number) => {
  const [y, m] = period.split("-");
  return `${String(Math.min(day, daysInMonth(period))).padStart(2, "0")}.${m}.${y}`;
};

function toFioCsv(period: string, movements: Movement[], opening: number, idSeed: number): string {
  const closing = movements.reduce((s, m) => s + m.amount, opening);
  const last = Math.max(...movements.map((m) => m.day));
  const header = [
    ["accountId", LANDLORD_ACCOUNT.number],
    ["bankId", LANDLORD_ACCOUNT.bank],
    ["currency", "CZK"],
    ["openingBalance", czAmount(opening)],
    ["closingBalance", czAmount(closing)],
    ["dateStart", czDate(period, 1)],
    ["dateEnd", czDate(period, last)],
  ].map((r) => r.map(q).join(";"));

  const columns = [
    "ID pohybu",
    "Datum",
    "Objem",
    "Měna",
    "Protiúčet",
    "Kód banky",
    "Název banky",
    "Název protiúčtu",
    "KS",
    "VS",
    "SS",
    "Zpráva pro příjemce",
    "Typ",
  ];
  const rows = movements.map((m, i) =>
    [
      String(idSeed + i),
      czDate(period, m.day),
      czAmount(m.amount),
      "CZK",
      m.account ?? "",
      m.bank ?? "",
      m.bank ? (BANK_NAMES[m.bank] ?? "") : "",
      m.name ?? "",
      m.amount > 0 ? "0308" : "",
      m.vs ?? "",
      "",
      m.message,
      m.type,
    ]
      .map(q)
      .join(";"),
  );
  return [...header, "", columns.map(q).join(";"), ...rows].join("\n") + "\n";
}

const rent = (
  who: (typeof DEMO_ACCOUNTS)[keyof typeof DEMO_ACCOUNTS],
  day: number,
  amount: number,
  period: string,
  vs: string = who.vs,
  message?: string,
): Movement => ({
  day,
  amount,
  account: who.account,
  bank: who.bank,
  name: who.name,
  vs,
  message: message ?? `Najem ${period.slice(5)}/${period.slice(0, 4)}`,
  type: "Bezhotovostní příjem",
});

const idBase = (period: string) => 26000000000 + Number(period.replace("-", "")) * 100;

/** Past month: everyone pays, Petr pays only part when `petrShort` is set. */
export function historyStatementCsv(period: string, petrShort: boolean): string {
  const a = DEMO_ACCOUNTS;
  return toFioCsv(
    period,
    [
      rent(a.kavarna, 3, 51000, period),
      rent(a.jana, 12, 21700, period),
      rent(a.petr, 13, petrShort ? 20000 : 28100, period),
      rent(a.eva, 14, 24500, period),
      rent(a.tomas, 18, 34700, period),
      { day: 28, amount: -149, message: "Poplatek za vedení účtu", type: "Platba kartou" },
    ],
    412380.55,
    idBase(period),
  );
}

/** Current month: one of every matching case. */
export function currentStatementCsv(period: string): string {
  const a = DEMO_ACCOUNTS;
  return toFioCsv(
    period,
    [
      rent(a.jana, 3, 21700, period), // exact
      rent(a.kavarna, 4, 52000, period), // overpaid by 1 000
      { ...rent(a.eva, 6, 24500, period, ""), message: "Najem Loft B" }, // no VS, known account
      rent(a.petr, 7, 5000, period), // partial: October is still not fully paid
      {
        day: 8,
        amount: 11900,
        account: "5566778899",
        bank: "0300",
        name: "Pavel Dvořák",
        vs: "2026030",
        message: "Najem Lucie Dvorakova",
        type: "Bezhotovostní příjem",
      }, // wrong VS, paid by a parent: needs review
      {
        day: 9,
        amount: -2420,
        account: "1234500987",
        bank: "0100",
        name: "Instalatérství Novák",
        message: "Faktura 2026-118, oprava odpadu Apt 2",
        type: "Bezhotovostní platba",
      }, // outgoing: a repair invoice, ignored
      rent(a.tomas, 10, 34700, period), // exact
      { day: 12, amount: -149, message: "Poplatek za vedení účtu", type: "Platba kartou" },
    ],
    598731.4,
    idBase(period),
  );
}
