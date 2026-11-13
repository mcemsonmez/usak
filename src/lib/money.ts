// Money is always integer minor units (haléř for CZK). 100 = 1 CZK.

export function formatMoney(minor: number, currency = "CZK", locale = "en-CZ"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

/** "18 500", "18500,50", "18,500.50" -> minor units. Throws on invalid input. */
export function parseMoney(input: string): number {
  let s = input
    .trim()
    .replace(/[\s ]/g, "")
    .replace(/(CZK|Kč)$/i, "");
  // "18,500.50" -> thousands comma; "18500,50" -> decimal comma
  if (/^-?\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s)) s = s.replace(/,/g, "");
  else s = s.replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) throw new Error(`Invalid amount: ${input}`);
  const negative = s.startsWith("-");
  const [whole, frac = ""] = s.replace("-", "").split(".");
  const minor = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return negative ? -minor : minor;
}
