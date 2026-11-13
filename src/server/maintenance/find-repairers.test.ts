import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { rankRepairers, toRepairer, weightedRating } = await import("./find-repairers");

const r = (
  name: string,
  rating: number | null,
  reviewsCount: number | null,
  phone: string | null = "+420 1",
) => ({
  name,
  category: null,
  phone,
  website: null,
  address: null,
  rating,
  reviewsCount,
  mapsUrl: null,
});

describe("repairer ranking", () => {
  it("does not let a single 5-star review beat many good reviews", () => {
    expect(weightedRating(r("a", 5, 1))).toBeLessThan(weightedRating(r("b", 4.8, 120)));
  });
  it("puts places without a phone last", () => {
    const ranked = rankRepairers([r("no phone", 5, 500, null), r("phone", 4, 10)]);
    expect(ranked.map((x) => x.name)).toEqual(["phone", "no phone"]);
  });
});

describe("toRepairer", () => {
  it("maps Apify fields and skips closed places", () => {
    expect(
      toRepairer({ title: "Fix s.r.o.", phone: "+420 2", totalScore: 4.5, reviewsCount: 8 }),
    ).toMatchObject({
      name: "Fix s.r.o.",
      phone: "+420 2",
      rating: 4.5,
    });
    expect(toRepairer({ title: "Gone", permanentlyClosed: true })).toBeNull();
    expect(toRepairer({ phone: "+420" })).toBeNull();
  });
});

describe("category relevance", () => {
  it("ranks a matching Google Maps category above a better-rated unrelated one", () => {
    const roofer = { ...r("Roofer", 5, 200), category: "Roofing contractor" };
    const plumber = { ...r("Novák", 4.2, 10), category: "Instalatér" };
    expect(rankRepairers([roofer, plumber], "plumbing").map((x) => x.name)).toEqual([
      "Novák",
      "Roofer",
    ]);
  });
});
