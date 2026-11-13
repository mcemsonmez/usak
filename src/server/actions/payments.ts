"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { bankTransaction, lease } from "@/db/schema";
import {
  applyMatch,
  importBankCsv,
  loadMatchContext,
  refreshChargeStatuses,
} from "@/server/bank/import";
import { resultForLease } from "@/server/bank/matching";
import { getOrgId } from "@/server/org";

export type ImportState =
  { error?: string; summary?: Awaited<ReturnType<typeof importBankCsv>> } | undefined;

export async function importStatementAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file" };
  if (file.size > 2_000_000) return { error: "File is too large (max 2 MB)" };
  const summary = await importBankCsv(db, await getOrgId(), await file.text());
  revalidatePath("/payments");
  revalidatePath("/charges");
  revalidatePath("/");
  return { summary };
}

export type MatchState = { error?: string } | undefined;

export async function matchManuallyAction(
  _prev: MatchState,
  formData: FormData,
): Promise<MatchState> {
  const transactionId = String(formData.get("transactionId") ?? "");
  const leaseId = String(formData.get("leaseId") ?? "");
  if (!leaseId) return { error: "Pick a lease" };
  const organizationId = await getOrgId();

  const [tx] = await db
    .select()
    .from(bankTransaction)
    .where(
      and(
        eq(bankTransaction.id, transactionId),
        eq(bankTransaction.organizationId, organizationId),
      ),
    );
  const [l] = await db
    .select({ id: lease.id })
    .from(lease)
    .where(and(eq(lease.id, leaseId), eq(lease.organizationId, organizationId)));
  if (!tx || !l) return { error: "Transaction or lease not found" };
  if (tx.matchStatus !== "needs_review") return { error: "This transaction is already handled" };

  const ctx = await loadMatchContext(db, organizationId);
  const result = resultForLease(
    tx.amount,
    l.id,
    ctx.openChargesByLease.get(l.id) ?? [],
    "Matched by hand",
  );
  const touched = await applyMatch(db, organizationId, tx.id, result);
  await refreshChargeStatuses(db, touched);

  revalidatePath("/payments");
  revalidatePath("/charges");
  revalidatePath("/");
  return {};
}
