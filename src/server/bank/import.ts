// Imports a bank CSV into the DB and runs automatic matching.
import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import type { db as Db } from "@/db";
import { bankTransaction, charge, lease, paymentAllocation } from "@/db/schema";
import { type CsvError, normalizeVs, parseBankCsv, type StatementInfo } from "./csv";
import {
  applyToContext,
  type MatchContext,
  type MatchResult,
  type MatchStatus,
  matchTransaction,
  type OpenCharge,
} from "./matching";

type Database = typeof Db;

export type ImportSummary = {
  statement: StatementInfo;
  imported: number;
  duplicates: number;
  errors: CsvError[];
  byStatus: Partial<Record<MatchStatus, number>>;
};

export async function loadMatchContext(
  database: Database,
  organizationId: string,
): Promise<MatchContext> {
  const leases = await database
    .select({
      id: lease.id,
      variableSymbol: lease.variableSymbol,
      rent: lease.rentAmount,
      service: lease.serviceChargeAmount,
    })
    .from(lease)
    .where(eq(lease.organizationId, organizationId));

  const open = await database
    .select({
      id: charge.id,
      leaseId: charge.leaseId,
      dueDate: charge.dueDate,
      type: charge.type,
      amount: charge.amount,
      paid: sql<number>`coalesce(sum(${paymentAllocation.amount}), 0)::int`,
    })
    .from(charge)
    .leftJoin(paymentAllocation, eq(paymentAllocation.chargeId, charge.id))
    .where(and(eq(charge.organizationId, organizationId), ne(charge.status, "paid")))
    .groupBy(charge.id);

  const history = await database
    .selectDistinct({ account: bankTransaction.counterAccount, leaseId: bankTransaction.leaseId })
    .from(bankTransaction)
    .where(
      and(
        eq(bankTransaction.organizationId, organizationId),
        isNotNull(bankTransaction.counterAccount),
        isNotNull(bankTransaction.leaseId),
        inArray(bankTransaction.matchStatus, ["matched", "partial", "overpaid"]),
      ),
    );

  // Only trust accounts that always paid the same lease.
  const leasesByAccount = new Map<string, Set<string>>();
  for (const h of history) {
    const set = leasesByAccount.get(h.account!) ?? new Set();
    set.add(h.leaseId!);
    leasesByAccount.set(h.account!, set);
  }

  const openChargesByLease = new Map<string, OpenCharge[]>();
  for (const c of open) {
    const list = openChargesByLease.get(c.leaseId) ?? [];
    list.push({ ...c, paid: Number(c.paid) });
    openChargesByLease.set(c.leaseId, list);
  }

  return {
    leaseIdByVs: new Map(leases.map((l) => [normalizeVs(l.variableSymbol)!, l.id])),
    monthlyDueByLease: new Map(leases.map((l) => [l.id, l.rent + l.service])),
    leaseIdByCounterAccount: new Map(
      [...leasesByAccount].filter(([, s]) => s.size === 1).map(([a, s]) => [a, [...s][0]]),
    ),
    openChargesByLease,
  };
}

/** Recompute open / partially_paid / paid from allocations. */
export async function refreshChargeStatuses(database: Database, chargeIds: string[]) {
  if (chargeIds.length === 0) return;
  await database.execute(sql`
    update charge set status = (case
      when coalesce((select sum(pa.amount) from payment_allocation pa where pa.charge_id = charge.id), 0) >= charge.amount then 'paid'
      when coalesce((select sum(pa.amount) from payment_allocation pa where pa.charge_id = charge.id), 0) > 0 then 'partially_paid'
      else 'open' end)::charge_status,
      updated_at = now()
    where ${inArray(charge.id, chargeIds)}
  `);
}

export async function applyMatch(
  database: Database,
  organizationId: string,
  transactionId: string,
  result: MatchResult,
): Promise<string[]> {
  if (result.allocations.length) {
    await database.insert(paymentAllocation).values(
      result.allocations.map((a) => ({
        organizationId,
        bankTransactionId: transactionId,
        chargeId: a.chargeId,
        amount: a.amount,
      })),
    );
  }
  await database
    .update(bankTransaction)
    .set({ matchStatus: result.status, leaseId: result.leaseId })
    .where(eq(bankTransaction.id, transactionId));
  return result.allocations.map((a) => a.chargeId);
}

export async function importBankCsv(
  database: Database,
  organizationId: string,
  text: string,
): Promise<ImportSummary> {
  const { transactions, errors, statement } = parseBankCsv(text);
  const summary: ImportSummary = { statement, imported: 0, duplicates: 0, errors, byStatus: {} };
  if (transactions.length === 0) return summary;

  const importBatchId = randomUUID();
  const inserted = await database
    .insert(bankTransaction)
    .values(transactions.map((t) => ({ ...t, organizationId, importBatchId })))
    .onConflictDoNothing({ target: [bankTransaction.organizationId, bankTransaction.importHash] })
    .returning();
  summary.imported = inserted.length;
  summary.duplicates = transactions.length - inserted.length;

  const ctx = await loadMatchContext(database, organizationId);
  const touched = new Set<string>();
  for (const tx of [...inserted].sort((a, b) => a.bookedOn.localeCompare(b.bookedOn))) {
    const result = matchTransaction(tx, ctx);
    applyToContext(ctx, result);
    for (const id of await applyMatch(database, organizationId, tx.id, result)) touched.add(id);
    summary.byStatus[result.status] = (summary.byStatus[result.status] ?? 0) + 1;
  }
  await refreshChargeStatuses(database, [...touched]);
  return summary;
}
