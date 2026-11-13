"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { unit } from "@/db/schema";
import { fetchMarketRent, type MarketRent } from "@/server/apify/market-rent";
import { getOrgId } from "@/server/org";

export type MarketRentState = { error?: string; result?: MarketRent } | undefined;

export async function marketRentAction(
  _prev: MarketRentState,
  formData: FormData,
): Promise<MarketRentState> {
  const unitId = String(formData.get("unitId") ?? "");
  const organizationId = await getOrgId();
  const u = await db.query.unit.findFirst({
    where: and(eq(unit.id, unitId), eq(unit.organizationId, organizationId)),
    with: { property: true },
  });
  if (!u) return { error: "Unit not found" };
  try {
    const result = await fetchMarketRent({
      city: u.property.city,
      rooms: u.rooms,
      areaM2: u.areaM2,
      commercial: u.property.type === "commercial",
    });
    return { result };
  } catch (e) {
    console.error("[market rent]", e);
    return { error: `Market rent lookup failed: ${(e as Error).message}` };
  }
}
