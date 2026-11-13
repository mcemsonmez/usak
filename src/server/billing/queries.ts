import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { charge, paymentAllocation } from "@/db/schema";
import type { ChargeWithPaid } from "./debtors";

/** Charges with the amount paid on each, optionally from a given period on. */
export async function loadChargesWithPaid(
  organizationId: string,
  fromPeriod?: string,
): Promise<(ChargeWithPaid & { type: string })[]> {
  const rows = await db
    .select({
      id: charge.id,
      leaseId: charge.leaseId,
      period: charge.period,
      type: charge.type,
      dueDate: charge.dueDate,
      amount: charge.amount,
      paid: sql<number>`coalesce(sum(${paymentAllocation.amount}), 0)::int`,
    })
    .from(charge)
    .leftJoin(paymentAllocation, eq(paymentAllocation.chargeId, charge.id))
    .where(
      and(
        eq(charge.organizationId, organizationId),
        fromPeriod ? gte(charge.period, fromPeriod) : undefined,
      ),
    )
    .groupBy(charge.id);
  return rows.map((r) => ({ ...r, paid: Number(r.paid) }));
}
