// Writes charges to the DB. Safe to run many times for the same month:
// the unique index (lease, period, type) makes it idempotent.
import { and, eq, inArray } from "drizzle-orm";
import type { db as Db } from "@/db";
import { charge, lease } from "@/db/schema";
import { chargesForPeriod } from "./charges";

export async function generateCharges(
  database: typeof Db,
  organizationId: string,
  period: string,
): Promise<{ created: number; existing: number }> {
  const leases = await database
    .select()
    .from(lease)
    .where(
      and(eq(lease.organizationId, organizationId), inArray(lease.status, ["active", "ended"])),
    );

  const drafts = leases.flatMap((l) => chargesForPeriod(l, period));
  if (drafts.length === 0) return { created: 0, existing: 0 };

  const inserted = await database
    .insert(charge)
    .values(drafts.map((d) => ({ ...d, organizationId, status: "open" as const })))
    .onConflictDoNothing({ target: [charge.leaseId, charge.period, charge.type] })
    .returning({ id: charge.id });

  return { created: inserted.length, existing: drafts.length - inserted.length };
}
