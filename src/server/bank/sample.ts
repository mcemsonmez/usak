// Demo bank statements. Matches the seeded leases (variable symbols and accounts).
import { daysInMonth } from "@/server/billing/charges";

export const DEMO_ACCOUNTS = {
  jana: { name: "Jana Nováková", account: "123456789/0800", vs: "2025001" },
  petr: { name: "Petr Svoboda", account: "2400112233/2010", vs: "2024002" },
  tomas: { name: "Tomáš Černý", account: "19-2000145399/0800", vs: "2025004" },
  eva: { name: "Eva Procházková", account: "2001234567/2010", vs: "2026005" },
  kavarna: { name: "Kavárna Anděl s.r.o.", account: "2700456789/2010", vs: "2023006" },
} as const;

type Row = [
  day: number,
  amount: string,
  account: string,
  name: string,
  vs: string,
  message: string,
];

function toCsv(period: string, rows: Row[]): string {
  const [y, m] = period.split("-");
  const last = daysInMonth(period);
  const lines = rows.map(([day, amount, account, name, vs, message]) =>
    [`${Math.min(day, last)}.${Number(m)}.${y}`, amount, "CZK", account, name, vs, message]
      .map((f) => (f.includes(";") ? `"${f}"` : f))
      .join(";"),
  );
  return (
    ["Datum;Objem;Měna;Protiúčet;Název protiúčtu;VS;Zpráva pro příjemce", ...lines].join("\n") +
    "\n"
  );
}

/** Past month: everyone pays, Petr pays only part when `petrShort` is set. */
export function historyStatementCsv(period: string, petrShort: boolean): string {
  const a = DEMO_ACCOUNTS;
  const msg = `Najem ${period}`;
  return toCsv(period, [
    [3, "51 000,00", a.kavarna.account, a.kavarna.name, a.kavarna.vs, msg],
    [12, "21 700,00", a.jana.account, a.jana.name, a.jana.vs, msg],
    [13, petrShort ? "20 000,00" : "28 100,00", a.petr.account, a.petr.name, a.petr.vs, msg],
    [14, "24 500,00", a.eva.account, a.eva.name, a.eva.vs, msg],
    [18, "34 700,00", a.tomas.account, a.tomas.name, a.tomas.vs, msg],
  ]);
}

/** Current month: one of every matching case. */
export function currentStatementCsv(period: string): string {
  const a = DEMO_ACCOUNTS;
  const msg = `Najem ${period}`;
  return toCsv(period, [
    [3, "21 700,00", a.jana.account, a.jana.name, a.jana.vs, msg], // exact
    [4, "52 000,00", a.kavarna.account, a.kavarna.name, a.kavarna.vs, msg], // overpaid by 1 000
    [6, "24 500,00", a.eva.account, a.eva.name, "", "Najem Loft B"], // no VS, known account
    [7, "15 000,00", a.petr.account, a.petr.name, a.petr.vs, msg], // partial, pays October first
    [8, "11 900,00", "5566778899/0300", "Pavel Dvořák", "2026030", "Najem Lucie"], // wrong VS -> review
    [10, "34 700,00", a.tomas.account, a.tomas.name, a.tomas.vs, msg], // exact
    [12, "-150,00", "", "", "", "Poplatek za vedeni uctu"], // bank fee, ignored
  ]);
}
