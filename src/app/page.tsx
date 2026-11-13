import { and, count, eq } from "drizzle-orm";
import Link from "next/link";
import { LeaseBadge } from "@/components/lease-badge";
import { ReminderBadge } from "@/components/reminder-badge";
import { StatTile } from "@/components/stat-tile";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { bankTransaction, lease, maintenanceRequest, unit } from "@/db/schema";
import { formatDate, todayIso } from "@/lib/dates";
import { leasePhase } from "@/lib/leases";
import { formatMoney } from "@/lib/money";
import { formatPeriod } from "@/lib/periods";
import { periodOf, shiftPeriod } from "@/server/billing/charges";
import { loadDebtorRows } from "@/server/billing/debtor-rows";
import { loadChargesWithPaid } from "@/server/billing/queries";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "—");

export default async function Dashboard() {
  const organizationId = await getOrgId();
  const today = todayIso();
  const current = periodOf(today);
  const months = [shiftPeriod(current, -2), shiftPeriod(current, -1), current];

  const [charges, debtors, units, leases, [review], [maintenance]] = await Promise.all([
    loadChargesWithPaid(organizationId, months[0]),
    loadDebtorRows(organizationId),
    db.select({ status: unit.status }).from(unit).where(eq(unit.organizationId, organizationId)),
    db.query.lease.findMany({
      where: eq(lease.organizationId, organizationId),
      with: { tenant: true, unit: { with: { property: true } } },
    }),
    db
      .select({ n: count() })
      .from(bankTransaction)
      .where(
        and(
          eq(bankTransaction.organizationId, organizationId),
          eq(bankTransaction.matchStatus, "needs_review"),
        ),
      ),
    db
      .select({ n: count() })
      .from(maintenanceRequest)
      .where(
        and(
          eq(maintenanceRequest.organizationId, organizationId),
          eq(maintenanceRequest.status, "new"),
        ),
      ),
  ]);

  const byMonth = months.map((period) => {
    const list = charges.filter((c) => c.period === period);
    const billed = list.reduce((s, c) => s + c.amount, 0);
    const collected = list.reduce((s, c) => s + Math.min(c.paid, c.amount), 0);
    return { period, billed, collected };
  });
  const thisMonth = byMonth[2];
  const overdueTotal = debtors.reduce((s, d) => s + d.overdue, 0);
  const occupied = units.filter((u) => u.status === "occupied").length;
  const ending = leases
    .filter((l) => leasePhase(l, today) === "ending_soon")
    .sort((a, b) => (a.endDate! < b.endDate! ? -1 : 1));

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Who owes how much, for which property, and have they paid? · {formatPeriod(current)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          label={`Collected in ${formatPeriod(current)}`}
          value={formatMoney(thisMonth.collected)}
          detail={
            thisMonth.billed
              ? `of ${formatMoney(thisMonth.billed)} billed · ${pct(thisMonth.collected, thisMonth.billed)}`
              : "No charges generated yet"
          }
          href={`/charges?period=${current}`}
        />
        <StatTile
          label="Overdue"
          value={formatMoney(overdueTotal)}
          detail={`${debtors.length} debtor${debtors.length === 1 ? "" : "s"}`}
          href="/debtors"
          tone={overdueTotal > 0 ? "critical" : undefined}
        />
        <StatTile
          label="Occupancy"
          value={pct(occupied, units.length)}
          detail={`${occupied} of ${units.length} units`}
          href="/properties"
        />
        <StatTile
          label="Payments to review"
          value={String(review.n)}
          detail="Could not be matched automatically"
          href="/payments"
          tone={review.n > 0 ? "warning" : undefined}
        />
        <StatTile
          label="New maintenance requests"
          value={String(maintenance.n)}
          detail="Waiting for action"
          href="/maintenance"
          tone={maintenance.n > 0 ? "warning" : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Debtors</CardTitle>
            <CardAction>
              <Link href="/debtors" className="text-muted-foreground text-sm hover:underline">
                All debtors →
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {debtors.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nobody is overdue.</p>
            ) : (
              <Table>
                <TableBody>
                  {debtors.slice(0, 5).map((d) => (
                    <TableRow key={d.leaseId}>
                      <TableCell>
                        <div className="font-medium">{d.lease.tenant.fullName}</div>
                        <div className="text-muted-foreground text-xs">
                          {d.lease.unit.property.name} · {d.lease.unit.label}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div className="font-medium">{formatMoney(d.overdue)}</div>
                        <div className="text-muted-foreground text-xs">
                          {d.daysOverdue} days late
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <ReminderBadge level={d.level} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collections by month</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Billed</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byMonth.map((m) => (
                  <TableRow key={m.period}>
                    <TableCell>
                      <Link href={`/charges?period=${m.period}`} className="hover:underline">
                        {formatPeriod(m.period)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(m.billed)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(m.collected)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {pct(m.collected, m.billed)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Leases ending soon</CardTitle>
          </CardHeader>
          <CardContent>
            {ending.length === 0 ? (
              <p className="text-muted-foreground text-sm">No leases end in the next 60 days.</p>
            ) : (
              <Table>
                <TableBody>
                  {ending.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.tenant.fullName}</TableCell>
                      <TableCell>
                        {l.unit.property.name} · {l.unit.label}
                      </TableCell>
                      <TableCell>Ends {formatDate(l.endDate)}</TableCell>
                      <TableCell className="text-right">
                        <LeaseBadge phase="ending_soon" endDate={l.endDate} today={today} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
