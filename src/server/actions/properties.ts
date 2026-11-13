"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { property, propertyType, unit } from "@/db/schema";
import { fieldErrors, formToObject, type FormState } from "@/lib/form";
import { getOrgId } from "@/server/org";

const propertySchema = z.object({
  name: z.string({ error: "Required" }).min(1, "Required"),
  address: z.string({ error: "Required" }).min(1, "Required"),
  city: z.string({ error: "Required" }).min(1, "Required"),
  type: z.enum(propertyType.enumValues),
});

export async function createProperty(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formToObject(formData);
  const parsed = propertySchema.safeParse(values);
  if (!parsed.success) return fieldErrors(parsed.error, values);

  const organizationId = await getOrgId();
  const [created] = await db
    .insert(property)
    .values({ ...parsed.data, organizationId })
    .returning({ id: property.id });

  revalidatePath("/properties");
  redirect(`/properties/${created.id}`);
}

const optionalInt = z.coerce.number().int().positive("Must be a positive number").optional();

const unitSchema = z.object({
  label: z.string({ error: "Required" }).min(1, "Required"),
  rooms: z.string().optional(),
  areaM2: optionalInt,
});

export async function createUnit(
  propertyId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formToObject(formData);
  const parsed = unitSchema.safeParse(values);
  if (!parsed.success) return fieldErrors(parsed.error, values);

  const organizationId = await getOrgId();
  const [owner] = await db
    .select({ id: property.id })
    .from(property)
    .where(and(eq(property.id, propertyId), eq(property.organizationId, organizationId)));
  if (!owner) return { error: "Property not found", values };

  await db.insert(unit).values({ ...parsed.data, propertyId, organizationId, status: "vacant" });
  revalidatePath(`/properties/${propertyId}`);
  return {};
}
