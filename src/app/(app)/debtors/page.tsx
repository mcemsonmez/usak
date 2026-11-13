import { DebtorRow } from "@/components/debtor-row";
import { PageHeader } from "@/components/page-header";
import { ReminderBadge } from "@/components/reminder-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { formatPeriod } from "@/lib/periods";
import { loadDebtorRows } from "@/server/billing/debtor-rows";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function DebtorsPage() {
  const rows = await loadDebtorRows(await getOrgId());
  const total = rows.reduce((s, r) => s + r.overdue, 0);

  return (
    <>
      <PageHeader
        title="Debtors"
        description={
          rows.length
            ? `${rows.length} tenant${rows.length === 1 ? "" : "s"} owe ${formatMoney(total)} past the due date`
            : "Nobody is overdue."
        }
      />
      <div data-table-card className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Overdue</TableHead>
              <TableHead>Months</TableHead>
              <TableHead>Oldest due</TableHead>
              <TableHead className="text-right">Days late</TableHead>
              <TableHead>Reminder</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <DebtorRow
                key={r.leaseId}
                colSpan={8}
                draft={r.draft}
                cells={
                  <>
                    <TableCell>
                      <div className="font-medium">{r.lease.tenant.fullName}</div>
                      <div className="text-muted-foreground text-xs">{r.lease.tenant.email}</div>
                    </TableCell>
                    <TableCell>
                      <div>{r.lease.unit.label}</div>
                      <div className="text-muted-foreground text-xs">
                        {r.lease.unit.property.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(r.overdue)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.periods.map(formatPeriod).join(", ")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(r.oldestDueDate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.daysOverdue}</TableCell>
                    <TableCell>
                      <ReminderBadge level={r.level} />
                    </TableCell>
                  </>
                }
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
