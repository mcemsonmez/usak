import { describe, expect, it } from "vitest";
import { buildQuery, extractRents, summarize } from "./market-rent";

describe("extractRents", () => {
  it("reads Czech price formats and skips per-m² prices and small fees", () => {
    const text =
      "Byt 2+kk, 54 m² · 18 500 Kč/měsíc + poplatky 3 500 Kč. Jiný byt 21.000 Kč, cena 450 Kč/m², 24000 CZK, 19 900,- Kč";
    expect(extractRents(text)).toEqual([18500, 21000, 24000, 19900]);
  });
});

describe("summarize", () => {
  it("returns median and quartiles in minor units, ignoring outliers", () => {
    const s = summarize([18000, 19000, 20000, 21000, 22000, 250000]);
    expect(s.sampleSize).toBe(5);
    expect(s.median).toBe(2_000_000);
    expect(s.low).toBe(1_900_000);
    expect(s.high).toBe(2_100_000);
  });
  it("needs at least three distinct prices", () => {
    expect(summarize([18000, 18000, 20000]).median).toBeNull();
  });
});

describe("buildQuery", () => {
  it("uses layout and district for apartments", () => {
    expect(buildQuery({ city: "Praha 2", rooms: "2+kk", areaM2: 54, commercial: false })).toBe(
      "pronájem bytu 2+kk Praha 2 cena Kč měsíc",
    );
  });
});
