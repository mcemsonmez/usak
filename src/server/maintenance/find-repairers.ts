import "server-only";
import { z } from "zod";

/**
 * Find repair professionals near a property after a maintenance request.
 * Uses the Apify Google Maps scraper (compass/crawler-google-places).
 */

export const REPAIR_CATEGORIES = {
  plumbing: "plumber",
  electrical: "electrician",
  heating: "heating repair",
  locks: "locksmith",
  appliances: "appliance repair",
  general: "handyman",
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

/** Best first: higher rating, then more reviews; places without a phone go last. */
export function rankRepairers(list: Repairer[]): Repairer[] {
  return [...list].sort(
    (a, b) =>
      Number(!!b.phone) - Number(!!a.phone) ||
      (b.rating ?? 0) - (a.rating ?? 0) ||
      (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0),
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
        searchStringsArray: [REPAIR_CATEGORIES[input.category]],
        locationQuery: input.location,
        maxCrawledPlacesPerSearch: input.limit * 2, // extra room for closed / incomplete places
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
  const repairers = items.map(toRepairer).filter((r): r is Repairer => r !== null);
  return rankRepairers(repairers).slice(0, input.limit);
}
