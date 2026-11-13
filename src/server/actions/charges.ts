"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { isPeriod } from "@/server/billing/charges";
import { generateCharges } from "@/server/billing/generate";
import { getOrgId } from "@/server/org";

export type GenerateState = { message?: string; error?: string } | undefined;

export async function generateChargesAction(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const period = String(formData.get("period") ?? "");
  if (!isPeriod(period)) return { error: "Invalid period" };
  const { created, existing } = await generateCharges(db, await getOrgId(), period);
  revalidatePath("/charges");
  revalidatePath("/dashboard");
  return {
    message:
      created === 0
        ? `No new charges for ${period} (${existing} already existed).`
        : `Created ${created} charges for ${period}${existing ? `, ${existing} already existed` : ""}.`,
  };
}
