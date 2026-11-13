// Bank statement CSV parsing. Handles generic and Czech bank exports (Fio, ČSOB, KB, Česká spořitelna):
// ";" or "," or tab delimiters, quoted fields, Czech headers, "18 500,00" amounts, "DD.MM.YYYY" dates,
// an account header block before the movements (Fio), and a separate bank-code column.
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

/** What the bank says about the statement itself (Fio puts it above the movements). */
export type StatementInfo = {
  account: string | null;
  currency: string | null;
  from: string | null;
  to: string | null;
  openingBalance: number | null; // minor units
  closingBalance: number | null;
};

export type ParseResult = {
  transactions: ParsedTransaction[];
  errors: CsvError[];
  statement: StatementInfo;
};

function detectDelimiter(firstLine: string): string {
  const counts = [";", ",", "\t"].map((d) => [d, firstLine.split(d).length - 1] as const);
  return counts.sort((a, b) => b[1] - a[1])[0][0];
}

/** Rows with the file line each starts on; blank rows dropped. */
export function splitCsvLines(text: string): { line: number; cells: string[] }[] {
  const t = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(t.split(/\r?\n/, 1)[0] ?? "");
  const rows: { line: number; cells: string[] }[] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let line = 1;
  let rowLine = 1;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQuotes) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else {
        if (c === "\n") line++;
        field += c;
      }
    } else if (c === '"') inQuotes = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(field);
      rows.push({ line: rowLine, cells: row });
      row = [];
      field = "";
      line++;
      rowLine = line;
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push({ line: rowLine, cells: row });
  }
  return rows.filter((r) => r.cells.some((f) => f.trim() !== ""));
}

export function splitCsv(text: string): string[][] {
  return splitCsvLines(text).map((r) => r.cells);
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
  bankCode: ["kodbanky", "bankcode", "kodbankyprotiuctu"],
  transactionId: ["idpohybu", "transactionid", "idtransakce", "referencebanky"],
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

const PREAMBLE_KEYS: Record<string, keyof StatementInfo | "bank"> = {
  accountid: "account",
  bankid: "bank",
  currency: "currency",
  datestart: "from",
  dateend: "to",
  openingbalance: "openingBalance",
  closingbalance: "closingBalance",
};

function readPreamble(rows: { cells: string[] }[]): StatementInfo {
  const raw: Record<string, string> = {};
  for (const r of rows) {
    const key = PREAMBLE_KEYS[normalizeHeader(r.cells[0] ?? "")];
    if (key && r.cells[1]?.trim()) raw[key] = r.cells[1].trim();
  }
  const money = (v?: string) => {
    if (!v) return null;
    try {
      return parseMoney(v);
    } catch {
      return null;
    }
  };
  return {
    account: raw.account ? (raw.bank ? `${raw.account}/${raw.bank}` : raw.account) : null,
    currency: raw.currency ?? null,
    from: raw.from ? parseDate(raw.from) : null,
    to: raw.to ? parseDate(raw.to) : null,
    openingBalance: money(raw.openingBalance),
    closingBalance: money(raw.closingBalance),
  };
}

const emptyStatement: StatementInfo = {
  account: null,
  currency: null,
  from: null,
  to: null,
  openingBalance: null,
  closingBalance: null,
};

export function parseBankCsv(text: string): ParseResult {
  const rows = splitCsvLines(text);
  if (rows.length === 0)
    return {
      transactions: [],
      errors: [{ line: 1, message: "File is empty" }],
      statement: emptyStatement,
    };

  // The movements table starts at the first row that has a date and an amount column.
  const headerAt = rows.findIndex((r) => {
    const c = mapColumns(r.cells);
    return c.date !== undefined && c.amount !== undefined;
  });
  if (headerAt < 0) {
    return {
      transactions: [],
      errors: [{ line: rows[0].line, message: "Missing column(s): date, amount" }],
      statement: emptyStatement,
    };
  }
  const statement = readPreamble(rows.slice(0, headerAt));
  const cols = mapColumns(rows[headerAt].cells);

  const transactions: ParsedTransaction[] = [];
  const errors: CsvError[] = [];
  const seen = new Map<string, number>();

  for (const { line, cells: r } of rows.slice(headerAt + 1)) {
    const bookedOn = parseDate(r[cols.date!] ?? "");
    if (!bookedOn) {
      errors.push({ line, message: `Invalid date "${r[cols.date!] ?? ""}"` });
      continue;
    }
    let amount: number;
    try {
      amount = parseMoney(r[cols.amount!] ?? "");
    } catch {
      errors.push({ line, message: `Invalid amount "${r[cols.amount!] ?? ""}"` });
      continue;
    }
    const pick = (c: Column) => (cols[c] === undefined ? null : clean(r[cols[c]!]));
    const account = pick("counterAccount");
    const bankCode = pick("bankCode");
    const tx = {
      bookedOn,
      amount,
      counterAccount:
        account && bankCode && !account.includes("/") ? `${account}/${bankCode}` : account,
      counterName: pick("counterName"),
      variableSymbol: normalizeVs(pick("variableSymbol")),
      message: pick("message"),
    };
    // The bank's own movement id is the safest duplicate key. Without it, identical rows in one
    // file are real (e.g. two equal payments), so count occurrences.
    const bankId = pick("transactionId");
    let key: string;
    if (bankId) key = `id|${statement.account ?? ""}|${bankId}`;
    else {
      const base = [tx.bookedOn, tx.amount, tx.variableSymbol, tx.counterAccount, tx.message].join(
        "|",
      );
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      key = `${base}|${n}`;
    }
    transactions.push({ ...tx, importHash: createHash("sha256").update(key).digest("hex") });
  }

  return { transactions, errors, statement };
}
