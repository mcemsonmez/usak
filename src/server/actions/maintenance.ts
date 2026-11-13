"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { maintenanceCategory, maintenanceRequest, maintenanceStatus, unit } from "@/db/schema";
import { fieldErrors, formToObject, type FormState } from "@/lib/form";
import { contactRepairer, type ContactResult } from "@/server/maintenance/contact-repairer";
import { findRepairers, type Repairer } from "@/server/maintenance/find-repairers";
import { getOrgId } from "@/server/org";

const requestSchema = z.object({
  unitId: z.uuid("Pick a unit"),
  category: z.enum(maintenanceCategory.enumValues),
  description: z.string({ error: "Describe the problem" }).min(5, "Describe the problem"),
});

export async function createMaintenanceRequest(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formToObject(formData);
  const parsed = requestSchema.safeParse(values);
  if (!parsed.success) return fieldErrors(parsed.error, values);
  const organizationId = await getOrgId();
  const [u] = await db
    .select({ id: unit.id })
    .from(unit)
    .where(and(eq(unit.id, parsed.data.unitId), eq(unit.organizationId, organizationId)));
  if (!u) return { error: "Unit not found", values };
  await db.insert(maintenanceRequest).values({ ...parsed.data, organizationId, status: "new" });
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  return {};
}

export async function updateMaintenanceStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = z.enum(maintenanceStatus.enumValues).parse(formData.get("status"));
  const organizationId = await getOrgId();
  await db
    .update(maintenanceRequest)
    .set({ status })
    .where(
      and(eq(maintenanceRequest.id, id), eq(maintenanceRequest.organizationId, organizationId)),
    );
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
}

async function loadRequest(id: string) {
  const organizationId = await getOrgId();
  return db.query.maintenanceRequest.findFirst({
    where: and(
      eq(maintenanceRequest.id, id),
      eq(maintenanceRequest.organizationId, organizationId),
    ),
    with: { unit: { with: { property: true } } },
  });
}

export type RepairersState =
  { error?: string; repairers?: Repairer[]; location?: string } | undefined;

/** Finds repair professionals near the property (Apify Google Maps scraper). */
export async function findRepairersAction(
  _prev: RepairersState,
  formData: FormData,
): Promise<RepairersState> {
  const req = await loadRequest(String(formData.get("requestId") ?? ""));
  if (!req) return { error: "Request not found" };
  // District level works better than the exact address (the exact address narrows the map too much).
  const location = `${req.unit.property.city}, Czechia`;
  try {
    const repairers = await findRepairers({ category: req.category, location, limit: 5 });
    return { repairers, location };
  } catch (e) {
    console.error("[find repairers]", e);
    return { error: `Repairer search failed: ${(e as Error).message}` };
  }
}

/** Placeholder: returns the message that would be sent; nothing is sent. */
export async function contactRepairerAction(
  requestId: string,
  repairer: Repairer,
  channel: "sms" | "email",
): Promise<ContactResult | { error: string }> {
  const req = await loadRequest(requestId);
  if (!req) return { error: "Request not found" };
  return contactRepairer({
    repairer,
    channel,
    issue: req.description,
    propertyAddress: `${req.unit.property.address}, ${req.unit.property.city} (${req.unit.label})`,
  });
}
