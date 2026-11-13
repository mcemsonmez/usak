"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { tenant } from "@/db/schema";
import { fieldErrors, formToObject, type FormState } from "@/lib/form";
import { getOrgId } from "@/server/org";

const tenantSchema = z.object({
  fullName: z.string({ error: "Required" }).min(1, "Required"),
  email: z.email("Enter a valid email").optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function createTenant(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formToObject(formData);
  const parsed = tenantSchema.safeParse(values);
  if (!parsed.success) return fieldErrors(parsed.error, values);

  const organizationId = await getOrgId();
  await db.insert(tenant).values({ ...parsed.data, organizationId });
  revalidatePath("/tenants");
  redirect("/tenants");
}
