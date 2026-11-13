"use server";

import { and, eq, gte, isNull, like, lte, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { lease, tenant, unit } from "@/db/schema";
import { fieldErrors, formToObject, isoDate, moneyField, type FormState } from "@/lib/form";
import { getOrgId } from "@/server/org";

const leaseSchema = z
  .object({
    unitId: z.uuid("Pick a unit"),
    tenantId: z.uuid("Pick a tenant"),
    startDate: isoDate,
    endDate: isoDate.optional(),
    rentAmount: moneyField.refine((v) => v > 0, "Rent must be more than 0"),
    serviceChargeAmount: moneyField.default(0),
    depositAmount: moneyField.default(0),
    dueDay: z.coerce.number().int().min(1, "1–28").max(28, "1–28"),
  })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    path: ["endDate"],
    message: "End date must be after the start date",
  });

/** Variable symbol = start year + 3-digit sequence, e.g. 2026007. Unique per organization. */
async function nextVariableSymbol(organizationId: string, year: string): Promise<string> {
  const rows = await db
    .select({ vs: lease.variableSymbol })
    .from(lease)
    .where(and(eq(lease.organizationId, organizationId), like(lease.variableSymbol, `${year}%`)));
  const max = rows.reduce((m, r) => Math.max(m, Number(r.vs.slice(4)) || 0), 0);
  return `${year}${String(max + 1).padStart(3, "0")}`;
}

export async function createLease(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formToObject(formData);
  const parsed = leaseSchema.safeParse(values);
  if (!parsed.success) return fieldErrors(parsed.error, values);
  const data = parsed.data;
  const organizationId = await getOrgId();

  const [u] = await db
    .select({ id: unit.id })
    .from(unit)
    .where(and(eq(unit.id, data.unitId), eq(unit.organizationId, organizationId)));
  const [t] = await db
    .select({ id: tenant.id })
    .from(tenant)
    .where(and(eq(tenant.id, data.tenantId), eq(tenant.organizationId, organizationId)));
  if (!u || !t) return { error: "Unit or tenant not found", values };

  // No two active leases on the same unit with overlapping dates.
  const [overlap] = await db
    .select({ id: lease.id, startDate: lease.startDate, endDate: lease.endDate })
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
      values,
    };
  }

  const variableSymbol = await nextVariableSymbol(organizationId, data.startDate.slice(0, 4));
  await db.transaction(async (tx) => {
    await tx.insert(lease).values({ ...data, organizationId, variableSymbol, status: "active" });
    await tx.update(unit).set({ status: "occupied" }).where(eq(unit.id, data.unitId));
  });

  revalidatePath("/leases");
  redirect("/leases");
}
