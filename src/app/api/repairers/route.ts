import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { contactRepairer } from "@/server/maintenance/contact-repairer";
import { findRepairers, type RepairCategory } from "@/server/maintenance/find-repairers";

// Dev/test endpoint:
// GET /api/repairers?category=plumbing&location=Prague%202&issue=Leaking%20sink
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const location = params.get("location") ?? "";
  try {
    const repairers = await findRepairers({
      category: (params.get("category") ?? "general") as RepairCategory,
      location,
      limit: Number(params.get("limit") ?? 5),
    });
    const issue = params.get("issue");
    const draft =
      issue && repairers[0]
        ? contactRepairer({ repairer: repairers[0], channel: "sms", issue, propertyAddress: location })
        : null;
    return NextResponse.json({ repairers, draft });
  } catch (e) {
    if (e instanceof ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
