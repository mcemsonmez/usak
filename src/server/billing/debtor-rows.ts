import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lease } from "@/db/schema";
import { todayIso } from "@/lib/dates";
import { computeDebtors } from "./debtors";
import { loadChargesWithPaid } from "./queries";
import { reminderDraft } from "./reminders";

export async function loadDebtorRows(organizationId: string) {
  const today = todayIso();
  const [charges, leases] = await Promise.all([
    loadChargesWithPaid(organizationId),
    db.query.lease.findMany({
      where: eq(lease.organizationId, organizationId),
      with: { tenant: true, unit: { with: { property: true } } },
    }),
  ]);
  const leaseById = new Map(leases.map((l) => [l.id, l]));
  return computeDebtors(charges, today).map((d) => {
    const l = leaseById.get(d.leaseId)!;
    return {
      ...d,
      lease: l,
      draft: reminderDraft({
        tenantName: l.tenant.fullName,
        unit: `${l.unit.property.name}, ${l.unit.label}`,
        overdue: d.overdue,
        periods: d.periods,
        variableSymbol: l.variableSymbol,
        level: d.level,
      }),
    };
  });
}
