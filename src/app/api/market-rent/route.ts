import { NextResponse } from "next/server";
import { fetchMarketRent } from "@/server/apify/market-rent";

// Dev/test endpoint: GET /api/market-rent?city=Praha%202&rooms=2%2Bkk
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  try {
    const result = await fetchMarketRent({
      city: p.get("city") ?? "Praha",
      rooms: p.get("rooms"),
      areaM2: p.get("area") ? Number(p.get("area")) : null,
      commercial: p.get("commercial") === "1",
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
