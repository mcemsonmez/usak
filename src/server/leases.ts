import "server-only";
import { and, eq, gte, isNull, like, lte, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { lease, tenant, unit } from "@/db/schema";
import { isoDate, moneyField } from "@/lib/form";

export const leaseFields = {
  unitId: z.uuid("Pick a unit"),
  startDate: isoDate,
  endDate: isoDate.optional(),
  rentAmount: moneyField.refine((v) => v > 0, "Rent must be more than 0"),
  serviceChargeAmount: moneyField.default(0),
  depositAmount: moneyField.default(0),
  dueDay: z.coerce.number().int().min(1, "1–28").max(28, "1–28"),
};

export const endAfterStart = {
  check: (d: { startDate: string; endDate?: string }) => !d.endDate || d.endDate >= d.startDate,
  params: { path: ["endDate"], message: "End date must be after the start date" },
};

export type LeaseInput = {
  unitId: string;
  startDate: string;
  endDate?: string;
  rentAmount: number;
  serviceChargeAmount: number;
  depositAmount: number;
  dueDay: number;
};

type TenantRef =
  { tenantId: string } | { newTenant: { fullName: string; email?: string; phone?: string } };

/** Variable symbol = start year + 3-digit sequence, e.g. 2026007. Unique per organization. */
async function nextVariableSymbol(organizationId: string, year: string): Promise<string> {
  const rows = await db
    .select({ vs: lease.variableSymbol })
    .from(lease)
    .where(and(eq(lease.organizationId, organizationId), like(lease.variableSymbol, `${year}%`)));
  const max = rows.reduce((m, r) => Math.max(m, Number(r.vs.slice(4)) || 0), 0);
  return `${year}${String(max + 1).padStart(3, "0")}`;
}

/**
 * Creates a lease (and the tenant, if new) after checking ownership and overlaps.
 * Returns an error message instead of throwing for expected problems.
 */
export async function saveLease(
  organizationId: string,
  data: LeaseInput,
  who: TenantRef,
): Promise<{ error: string } | { leaseId: string; variableSymbol: string }> {
  const [u] = await db
    .select({ id: unit.id })
    .from(unit)
    .where(and(eq(unit.id, data.unitId), eq(unit.organizationId, organizationId)));
  if (!u) return { error: "Unit not found" };

  if ("tenantId" in who) {
    const [t] = await db
      .select({ id: tenant.id })
      .from(tenant)
      .where(and(eq(tenant.id, who.tenantId), eq(tenant.organizationId, organizationId)));
    if (!t) return { error: "Tenant not found" };
  }

  // No two active leases on the same unit with overlapping dates.
  const [overlap] = await db
    .select({ startDate: lease.startDate, endDate: lease.endDate })
    .from(lease)
    .where(
      and(
        eq(lease.organizationId, organizationId),
        eq(lease.unitId, data.unitId),
        eq(lease.status, "active"),
        data.endDate ? lte(lease.startDate, data.endDate) : undefined,
        or(isNull(lease.endDate), gte(lease.endDate, data.startDate)),
      ),
    )
    .limit(1);
  if (overlap) {
    return {
      error: `This unit already has an active lease from ${overlap.startDate} to ${overlap.endDate ?? "indefinite"}.`,
    };
  }

  const variableSymbol = await nextVariableSymbol(organizationId, data.startDate.slice(0, 4));
  const leaseId = await db.transaction(async (tx) => {
    let tenantId: string;
    if ("tenantId" in who) tenantId = who.tenantId;
    else {
      const [created] = await tx
        .insert(tenant)
        .values({ ...who.newTenant, organizationId })
        .returning({ id: tenant.id });
      tenantId = created.id;
    }
    const [created] = await tx
      .insert(lease)
      .values({ ...data, tenantId, organizationId, variableSymbol, status: "active" })
      .returning({ id: lease.id });
    await tx.update(unit).set({ status: "occupied" }).where(eq(unit.id, data.unitId));
    return created.id;
  });
  return { leaseId, variableSymbol };
}
