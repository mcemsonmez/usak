import "server-only";
import { z } from "zod";

/**
 * Find repair professionals near a property after a maintenance request.
 * Uses the Apify Google Maps scraper (compass/crawler-google-places).
 */

// Search terms in Czech and English, plus words that mark a relevant Google Maps category.
export const REPAIR_CATEGORIES = {
  plumbing: { search: ["instalatér", "plumber"], match: ["plumb", "instalat", "vodo"] },
  electrical: { search: ["elektrikář", "electrician"], match: ["electric", "elektr"] },
  heating: {
    search: ["topenář", "heating repair"],
    match: ["heating", "hvac", "boiler", "topen", "kotl"],
  },
  locks: { search: ["zámečník", "locksmith"], match: ["locksmith", "zámeč", "zamec"] },
  appliances: {
    search: ["oprava spotřebičů", "appliance repair"],
    match: ["appliance", "spotřebič", "spotrebic"],
  },
  general: {
    search: ["hodinový manžel", "handyman"],
    match: ["handyman", "manžel", "manzel", "maintenance"],
  },
} as const;

export type RepairCategory = keyof typeof REPAIR_CATEGORIES;

export const findRepairersInput = z.object({
  category: z.enum(Object.keys(REPAIR_CATEGORIES) as [RepairCategory, ...RepairCategory[]]),
  location: z.string().trim().min(2), // e.g. "Prague 2, Czechia" or a full property address
  limit: z.number().int().min(1).max(20).default(5),
  language: z.string().default("en"),
});

export type FindRepairersInput = z.input<typeof findRepairersInput>;

export type Repairer = {
  name: string;
  category: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  rating: number | null;
  reviewsCount: number | null;
  mapsUrl: string | null;
};

const APIFY_ACTOR = "compass~crawler-google-places";

// Shape of the fields we use from the actor's dataset items.
const apifyPlace = z
  .object({
    title: z.string().nullish(),
    categoryName: z.string().nullish(),
    phone: z.string().nullish(),
    website: z.string().nullish(),
    address: z.string().nullish(),
    totalScore: z.number().nullish(),
    reviewsCount: z.number().nullish(),
    url: z.string().nullish(),
    permanentlyClosed: z.boolean().nullish(),
    temporarilyClosed: z.boolean().nullish(),
  })
  .passthrough();

export function toRepairer(item: unknown): Repairer | null {
  const parsed = apifyPlace.safeParse(item);
  if (!parsed.success || !parsed.data.title) return null;
  const p = parsed.data;
  if (p.permanentlyClosed || p.temporarilyClosed) return null;
  return {
    name: p.title!,
    category: p.categoryName ?? null,
    phone: p.phone ?? null,
    website: p.website ?? null,
    address: p.address ?? null,
    rating: p.totalScore ?? null,
    reviewsCount: p.reviewsCount ?? null,
    mapsUrl: p.url ?? null,
  };
}

/**
 * Weighted rating: few reviews pull the score towards a prior of 4.0 (as if 5 extra
 * 4-star reviews), so "5.0 from 1 review" does not beat "4.8 from 120 reviews".
 */
export function weightedRating(r: Pick<Repairer, "rating" | "reviewsCount">): number {
  const n = r.reviewsCount ?? 0;
  if (!r.rating || n === 0) return 0;
  return (r.rating * n + 4 * 5) / (n + 5);
}

/** True if the Google Maps category fits the repair category. */
export function isRelevant(
  r: Pick<Repairer, "category" | "name">,
  category: RepairCategory,
): boolean {
  const text = `${r.category ?? ""} ${r.name}`.toLowerCase();
  return REPAIR_CATEGORIES[category].match.some((m) => text.includes(m));
}

/** Best first: relevant category, then places with a phone, then weighted rating. */
export function rankRepairers(list: Repairer[], category?: RepairCategory): Repairer[] {
  const rel = (r: Repairer) => (category ? Number(isRelevant(r, category)) : 0);
  return [...list].sort(
    (a, b) =>
      rel(b) - rel(a) ||
      Number(!!b.phone) - Number(!!a.phone) ||
      weightedRating(b) - weightedRating(a),
  );
}

export async function findRepairers(rawInput: FindRepairersInput): Promise<Repairer[]> {
  const input = findRepairersInput.parse(rawInput);
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN is not set");

  const res = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        searchStringsArray: [...REPAIR_CATEGORIES[input.category].search],
        locationQuery: input.location,
        maxCrawledPlacesPerSearch: input.limit * 2, // per search term; extra room for filtering
        language: input.language,
        skipClosedPlaces: true,
      }),
      signal: AbortSignal.timeout(240_000),
    },
  );
  if (!res.ok) {
    throw new Error(`Apify request failed: HTTP ${res.status} ${await res.text()}`);
  }

  const items: unknown[] = await res.json();
  const seen = new Set<string>();
  const repairers = items
    .map(toRepairer)
    .filter((r): r is Repairer => r !== null && !seen.has(r.name) && !!seen.add(r.name));
  return rankRepairers(repairers, input.category).slice(0, input.limit);
}
