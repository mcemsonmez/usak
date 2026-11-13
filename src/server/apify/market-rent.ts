// Market rent from public listings, via the Apify RAG Web Browser actor
// (searches the web and returns each result page as markdown).

export type MarketRentQuery = {
  city: string;
  rooms: string | null;
  areaM2: number | null;
  commercial: boolean;
};

export type MarketRent = {
  query: string;
  sampleSize: number;
  median: number | null; // minor units per month
  low: number | null; // 25th percentile
  high: number | null; // 75th percentile
  sources: { title: string; url: string }[];
};

export function buildQuery(q: MarketRentQuery): string {
  if (q.commercial) return `pronájem obchodního prostoru ${q.city} cena Kč měsíc`;
  return `pronájem bytu ${q.rooms ?? ""} ${q.city} cena Kč měsíc`.replace(/\s+/g, " ").trim();
}

/**
 * Monthly rents in listing text: "18 500 Kč/měsíc", "18.500 Kč", "Nájem 21 000 Kč".
 * Keeps plausible monthly rents only (5 000 – 300 000 CZK); returns CZK.
 */
export function extractRents(text: string, opts: { min?: number; max?: number } = {}): number[] {
  const min = opts.min ?? 5_000;
  const max = opts.max ?? 300_000;
  const re = /(\d{1,3}(?:[  .]\d{3})+|\d{4,6})\s*(?:,-\s*)?(?:Kč|CZK)(?!\s*\/\s*m(?:²|2))/gi;
  const out: number[] = [];
  for (const m of text.matchAll(re)) {
    const n = Number(m[1].replace(/[  .]/g, ""));
    if (n >= min && n <= max) out.push(n);
  }
  return out;
}

export function percentile(sorted: number[], p: number): number {
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
}

export function summarize(
  rentsCzk: number[],
): Pick<MarketRent, "sampleSize" | "median" | "low" | "high"> {
  // Drop duplicates (same listing repeated on a page) and extreme outliers.
  const sorted = [...new Set(rentsCzk)].sort((a, b) => a - b);
  if (sorted.length < 3) return { sampleSize: sorted.length, median: null, low: null, high: null };
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const iqr = q3 - q1;
  const kept = sorted.filter((n) => n >= q1 - 1.5 * iqr && n <= q3 + 1.5 * iqr);
  return {
    sampleSize: kept.length,
    median: percentile(kept, 0.5) * 100,
    low: percentile(kept, 0.25) * 100,
    high: percentile(kept, 0.75) * 100,
  };
}

type RagItem = {
  markdown?: string;
  text?: string;
  metadata?: { title?: string; url?: string };
  searchResult?: { title?: string; url?: string };
};

export async function fetchMarketRent(q: MarketRentQuery): Promise<MarketRent> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN is not set");
  const query = buildQuery(q);

  const res = await fetch(
    "https://api.apify.com/v2/acts/apify~rag-web-browser/run-sync-get-dataset-items",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, maxResults: 4, outputFormats: ["markdown"] }),
      signal: AbortSignal.timeout(180_000),
    },
  );
  if (!res.ok)
    throw new Error(`Apify request failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const items: RagItem[] = await res.json();

  const rents = items.flatMap((i) => extractRents(i.markdown ?? i.text ?? ""));
  return {
    query,
    ...summarize(rents),
    sources: items
      .map((i) => ({
        title: i.metadata?.title ?? i.searchResult?.title ?? "",
        url: i.metadata?.url ?? i.searchResult?.url ?? "",
      }))
      .filter((s) => s.url),
  };
}
