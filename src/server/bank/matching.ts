// Pure payment matching. Rules, in order:
// 1. Variable symbol matches a lease -> allocate to its open charges, oldest first.
//    Exact cover = matched, short = partial, more than owed = overpaid.
// 2. No variable symbol match, but the counter account paid this lease before and the
//    amount equals the lease's monthly total -> same as rule 1.
// 3. Otherwise -> needs_review (a person matches it by hand).
// Outgoing payments (amount <= 0) are ignored (unmatched).

export type OpenCharge = {
  id: string;
  leaseId: string;
  dueDate: string;
  type: string;
  amount: number;
  paid: number;
};

export type MatchContext = {
  leaseIdByVs: Map<string, string>;
  leaseIdByCounterAccount: Map<string, string>;
  monthlyDueByLease: Map<string, number>;
  openChargesByLease: Map<string, OpenCharge[]>;
};

export type MatchStatus = "unmatched" | "matched" | "partial" | "overpaid" | "needs_review";

export type MatchResult = {
  status: MatchStatus;
  leaseId: string | null;
  allocations: { chargeId: string; amount: number }[];
  leftover: number;
  reason: string;
};

export function sortCharges(charges: OpenCharge[]): OpenCharge[] {
  return [...charges].sort(
    (a, b) =>
      a.dueDate.localeCompare(b.dueDate) ||
      Number(a.type !== "rent") - Number(b.type !== "rent") ||
      a.id.localeCompare(b.id),
  );
}

/** Spread an amount over charges, oldest first. */
export function allocate(amount: number, charges: OpenCharge[]) {
  let left = amount;
  const allocations: { chargeId: string; amount: number }[] = [];
  let leavesPartial = false;
  for (const c of sortCharges(charges)) {
    const due = c.amount - c.paid;
    if (due <= 0) continue;
    if (left <= 0) break;
    const take = Math.min(due, left);
    allocations.push({ chargeId: c.id, amount: take });
    left -= take;
    if (take < due) leavesPartial = true;
  }
  return { allocations, leftover: left, leavesPartial };
}

export function resultForLease(
  amount: number,
  leaseId: string,
  charges: OpenCharge[],
  via: string,
): MatchResult {
  const { allocations, leftover, leavesPartial } = allocate(amount, charges);
  if (leftover > 0)
    return {
      status: "overpaid",
      leaseId,
      allocations,
      leftover,
      reason: `${via}; paid more than owed`,
    };
  if (leavesPartial)
    return {
      status: "partial",
      leaseId,
      allocations,
      leftover,
      reason: `${via}; paid less than owed`,
    };
  return { status: "matched", leaseId, allocations, leftover, reason: via };
}

export function matchTransaction(
  tx: { amount: number; variableSymbol: string | null; counterAccount: string | null },
  ctx: MatchContext,
): MatchResult {
  if (tx.amount <= 0)
    return {
      status: "unmatched",
      leaseId: null,
      allocations: [],
      leftover: 0,
      reason: "Outgoing payment",
    };

  const byVs = tx.variableSymbol ? ctx.leaseIdByVs.get(tx.variableSymbol) : undefined;
  if (byVs)
    return resultForLease(
      tx.amount,
      byVs,
      ctx.openChargesByLease.get(byVs) ?? [],
      "Variable symbol",
    );

  const byAccount = tx.counterAccount
    ? ctx.leaseIdByCounterAccount.get(tx.counterAccount)
    : undefined;
  if (byAccount && ctx.monthlyDueByLease.get(byAccount) === tx.amount) {
    return resultForLease(
      tx.amount,
      byAccount,
      ctx.openChargesByLease.get(byAccount) ?? [],
      "Known account + usual amount",
    );
  }

  return {
    status: "needs_review",
    leaseId: null,
    allocations: [],
    leftover: tx.amount,
    reason: tx.variableSymbol ? "Unknown variable symbol" : "No variable symbol",
  };
}

/** Record allocations in the in-memory context so the next transaction sees them. */
export function applyToContext(ctx: MatchContext, result: MatchResult): void {
  if (!result.leaseId) return;
  const charges = ctx.openChargesByLease.get(result.leaseId) ?? [];
  for (const a of result.allocations) {
    const c = charges.find((x) => x.id === a.chargeId);
    if (c) c.paid += a.amount;
  }
}
