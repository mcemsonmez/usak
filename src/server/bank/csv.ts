// Bank statement CSV parsing. Handles generic and Czech bank exports:
// ";" or "," or tab delimiters, quoted fields, Czech headers, "18 500,00" amounts,
// "DD.MM.YYYY" dates.
import { createHash } from "node:crypto";
import { parseMoney } from "@/lib/money";

export type ParsedTransaction = {
  bookedOn: string;
  amount: number; // minor units, positive = incoming
  counterAccount: string | null;
  counterName: string | null;
  variableSymbol: string | null;
  message: string | null;
  importHash: string;
};

export type CsvError = { line: number; message: string };

export type ParseResult = { transactions: ParsedTransaction[]; errors: CsvError[] };

function detectDelimiter(firstLine: string): string {
  const counts = [";", ",", "\t"].map((d) => [d, firstLine.split(d).length - 1] as const);
  return counts.sort((a, b) => b[1] - a[1])[0][0];
}

export function splitCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, "");
  const delimiter = detectDelimiter(t.split(/\r?\n/, 1)[0] ?? "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQuotes) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

const normalizeHeader = (h: string) =>
  h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const ALIASES = {
  date: [
    "date",
    "bookingdate",
    "bookedon",
    "datum",
    "datumzauctovani",
    "datumpohybu",
    "datumprovedeni",
    "datumsplatnosti",
  ],
  amount: ["amount", "castka", "objem", "suma", "castkavcm"],
  variableSymbol: ["variablesymbol", "vs", "variabilnisymbol"],
  counterAccount: [
    "counteraccount",
    "protiucet",
    "cisloprotiuctu",
    "protiucetakodbanky",
    "account",
    "ucet",
  ],
  counterName: [
    "countername",
    "nazevprotiuctu",
    "name",
    "nazev",
    "jmeno",
    "payer",
    "odesilatel",
    "nazevprotistrany",
  ],
  message: ["message", "zprava", "zpravaproprijemce", "note", "poznamka", "description", "popis"],
} as const;

type Column = keyof typeof ALIASES;

export function mapColumns(headers: string[]): Partial<Record<Column, number>> {
  const normalized = headers.map(normalizeHeader);
  const map: Partial<Record<Column, number>> = {};
  for (const [col, aliases] of Object.entries(ALIASES) as [Column, readonly string[]][]) {
    const idx = normalized.findIndex((h) => aliases.includes(h));
    if (idx >= 0) map[col] = idx;
  }
  return map;
}

export function parseDate(value: string): string | null {
  const v = value.trim();
  let y: number, m: number, d: number;
  let match = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = v.match(/^(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4})/)))
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d)
    return null;
  return date.toISOString().slice(0, 10);
}

/** Digits only, without leading zeros. "0002025001" -> "2025001". */
export function normalizeVs(value: string | null | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "").replace(/^0+/, "");
  return digits || null;
}

const clean = (v: string | undefined) => {
  const t = v?.trim();
  return t ? t : null;
};

export function parseBankCsv(text: string): ParseResult {
  const rows = splitCsv(text);
  if (rows.length === 0)
    return { transactions: [], errors: [{ line: 1, message: "File is empty" }] };

  const cols = mapColumns(rows[0]);
  const missing = (["date", "amount"] as const).filter((c) => cols[c] === undefined);
  if (missing.length) {
    return {
      transactions: [],
      errors: [{ line: 1, message: `Missing column(s): ${missing.join(", ")}` }],
    };
  }

  const transactions: ParsedTransaction[] = [];
  const errors: CsvError[] = [];
  const seen = new Map<string, number>();

  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const bookedOn = parseDate(r[cols.date!] ?? "");
    if (!bookedOn) return errors.push({ line, message: `Invalid date "${r[cols.date!] ?? ""}"` });
    let amount: number;
    try {
      amount = parseMoney(r[cols.amount!] ?? "");
    } catch {
      return errors.push({ line, message: `Invalid amount "${r[cols.amount!] ?? ""}"` });
    }
    const pick = (c: Column) => (cols[c] === undefined ? null : clean(r[cols[c]!]));
    const tx = {
      bookedOn,
      amount,
      counterAccount: pick("counterAccount"),
      counterName: pick("counterName"),
      variableSymbol: normalizeVs(pick("variableSymbol")),
      message: pick("message"),
    };
    // Identical rows in one file are real (e.g. two equal payments), so count occurrences.
    const key = [tx.bookedOn, tx.amount, tx.variableSymbol, tx.counterAccount, tx.message].join(
      "|",
    );
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    const importHash = createHash("sha256").update(`${key}|${n}`).digest("hex");
    transactions.push({ ...tx, importHash });
  });

  return { transactions, errors };
}
