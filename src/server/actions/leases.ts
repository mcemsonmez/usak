"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fieldErrors, formToObject, type FormState } from "@/lib/form";
import { endAfterStart, leaseFields, saveLease } from "@/server/leases";
import { getOrgId } from "@/server/org";

const leaseSchema = z
  .object({ ...leaseFields, tenantId: z.uuid("Pick a tenant") })
  .refine(endAfterStart.check, endAfterStart.params);

export async function createLease(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formToObject(formData);
  const parsed = leaseSchema.safeParse(values);
  if (!parsed.success) return fieldErrors(parsed.error, values);
  const { tenantId, ...data } = parsed.data;

  const result = await saveLease(await getOrgId(), data, { tenantId });
  if ("error" in result) return { error: result.error, values };

  revalidatePath("/leases");
  redirect("/leases");
}

const reviewSchema = z
  .object({
    ...leaseFields,
    tenantId: z.union([z.literal("new"), z.uuid()], { error: "Pick a tenant" }),
    newTenantName: z.string().optional(),
    newTenantEmail: z.email("Enter a valid email").optional(),
    newTenantPhone: z.string().optional(),
  })
  .refine(endAfterStart.check, endAfterStart.params)
  .refine((d) => d.tenantId !== "new" || !!d.newTenantName, {
    path: ["newTenantName"],
    message: "Enter the tenant's name",
  });

/** Saves a lease the user reviewed after AI extraction. Creates the tenant if new. */
export async function createLeaseFromReview(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formToObject(formData);
  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success) return fieldErrors(parsed.error, values);
  const { tenantId, newTenantName, newTenantEmail, newTenantPhone, ...data } = parsed.data;

  const result = await saveLease(
    await getOrgId(),
    data,
    tenantId === "new"
      ? { newTenant: { fullName: newTenantName!, email: newTenantEmail, phone: newTenantPhone } }
      : { tenantId },
  );
  if ("error" in result) return { error: result.error, values };

  revalidatePath("/leases");
  revalidatePath("/tenants");
  revalidatePath("/");
  redirect(`/leases?created=${result.variableSymbol}`);
}
