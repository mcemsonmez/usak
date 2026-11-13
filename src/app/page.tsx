import { and, count, desc, eq, gt } from "drizzle-orm";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReminderBadge } from "@/components/reminder-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/stat-tile";
import { db } from "@/db";
import { bankTransaction, lease, maintenanceRequest, unit } from "@/db/schema";
import { daysBetween, formatDate, todayIso } from "@/lib/dates";
import { leasePhase } from "@/lib/leases";
import { formatMoney } from "@/lib/money";
import { formatPeriod } from "@/lib/periods";
import { periodOf, shiftPeriod } from "@/server/billing/charges";
import { loadDebtorRows } from "@/server/billing/debtor-rows";
import { loadChargesWithPaid } from "@/server/billing/queries";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

const pct = (part: number, whole: number) =>
  whole ? `${Math.round((part / whole) * 100)}%` : "0%";

export default async function Dashboard() {
  const organizationId = await getOrgId();
  const today = todayIso();
  const current = periodOf(today);
  const months = [shiftPeriod(current, -2), shiftPeriod(current, -1), current];

  const [charges, debtors, units, leases, [review], [maintenance], payments] = await Promise.all([
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
    db.query.bankTransaction.findMany({
      where: and(eq(bankTransaction.organizationId, organizationId), gt(bankTransaction.amount, 0)),
      with: { lease: { with: { tenant: true } } },
      orderBy: [desc(bankTransaction.bookedOn), desc(bankTransaction.createdAt)],
      limit: 5,
    }),
  ]);

  // Each month split into what came in, what is late, and what is not due yet.
  const ledger = months.map((period) => {
    let collected = 0;
    let overdue = 0;
    let notDue = 0;
    for (const c of charges.filter((x) => x.period === period)) {
      const paid = Math.min(c.paid, c.amount);
      collected += paid;
      if (c.dueDate < today) overdue += c.amount - paid;
      else notDue += c.amount - paid;
    }
    return { period, collected, overdue, notDue, billed: collected + overdue + notDue };
  });
  const thisMonth = ledger[2];
  const overdueTotal = debtors.reduce((s, d) => s + d.overdue, 0);
  const occupied = units.filter((u) => u.status === "occupied").length;
  const ending = leases
    .filter((l) => leasePhase(l, today) === "ending_soon")
    .sort((a, b) => (a.endDate! < b.endDate! ? -1 : 1));
  const shown = debtors.slice(0, 3);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-sm">{formatPeriod(current)}</p>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
        </div>
      </div>

      {/* Signature: the app's one question, answered first. */}
      <section
        aria-labelledby="answer"
        className="bg-ink grid overflow-hidden rounded-2xl text-white lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
      >
        <div className="grid content-between gap-6 p-6 sm:p-8">
          <h2 id="answer" className="text-4xl font-semibold sm:text-5xl">
            Who owes?
          </h2>
          <p className="text-sidebar-muted text-sm">
            {debtors.length === 0
              ? "Nobody is late."
              : `${debtors.length} tenant${debtors.length === 1 ? "" : "s"} past the due date, `}
            {debtors.length > 0 && (
              <span className="text-white">{formatMoney(overdueTotal)} in total</span>
            )}
          </p>
        </div>
        <div className="border-t border-white/10 lg:border-t-0 lg:border-l">
          {shown.length === 0 ? (
            <p className="p-6 text-2xl font-semibold sm:p-8">
              Everyone has paid. Nothing to chase.
            </p>
          ) : (
            <ul className="divide-y divide-white/10">
              {shown.map((d) => (
                <li key={d.leaseId}>
                  <Link
                    href="/debtors"
                    className="group grid gap-2 px-6 py-5 transition-colors duration-(--dur-micro) hover:bg-white/[0.04] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-8"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold">{d.lease.tenant.fullName}</p>
                      <p className="text-sidebar-muted text-sm">
                        {d.lease.unit.label}, {d.lease.unit.property.name}. {d.daysOverdue} days
                        late.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <ReminderBadge level={d.level} onDark />
                      <span className="text-lime font-mono text-3xl font-semibold tracking-tight tabular-nums">
                        {formatMoney(d.overdue)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
              {debtors.length > shown.length && (
                <li className="px-6 py-3 text-sm sm:px-8">
                  <Link href="/debtors" className="text-lime font-medium hover:underline">
                    {debtors.length - shown.length} more on the debtors list
                  </Link>
                </li>
              )}
            </ul>
          )}
        </div>
      </section>

      <section aria-label="Key figures" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          label="Collected this month"
          value={formatMoney(thisMonth.collected)}
          detail={
            thisMonth.billed
              ? `${pct(thisMonth.collected, thisMonth.billed)} of ${formatMoney(thisMonth.billed)} billed`
              : "No charges generated yet"
          }
          href={`/charges?period=${current}`}
          tone={thisMonth.collected > 0 ? "good" : "none"}
        />
        <StatTile
          label="Overdue"
          value={formatMoney(overdueTotal)}
          detail={`${debtors.length} tenant${debtors.length === 1 ? "" : "s"} late`}
          href="/debtors"
          tone={overdueTotal > 0 ? "bad" : "none"}
        />
        <StatTile
          label="Occupancy"
          value={pct(occupied, units.length)}
          detail={`${occupied} of ${units.length} units let`}
          href="/properties"
        />
        <StatTile
          label="To review"
          value={String(review.n)}
          detail="Payments not matched"
          href="/payments"
          tone={review.n > 0 ? "warn" : "none"}
        />
        <StatTile
          label="New repairs"
          value={String(maintenance.n)}
          detail="Waiting for a repairer"
          href="/maintenance"
          tone={maintenance.n > 0 ? "warn" : "none"}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Collections</CardTitle>
          <CardAction>
            <ul className="text-muted-foreground flex flex-wrap gap-4 text-xs" aria-label="Legend">
              <li className="flex items-center gap-1.5">
                <span aria-hidden className="bg-good size-2.5 rounded-sm" /> Collected
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden className="bg-bad size-2.5 rounded-sm" /> Overdue
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden className="bg-track size-2.5 rounded-sm border" /> Not due yet
              </li>
            </ul>
          </CardAction>
        </CardHeader>
        <CardContent className="grid">
          {ledger.map((m) => (
            <Link
              key={m.period}
              href={`/charges?period=${m.period}`}
              className="hover:bg-muted/60 -mx-2 grid items-center gap-3 rounded-lg px-2 py-3 transition-colors duration-(--dur-micro) md:grid-cols-[9rem_minmax(0,1fr)_auto] md:gap-6"
            >
              <span className="text-sm font-medium">{formatPeriod(m.period)}</span>
              {m.billed > 0 ? (
                <div
                  className="bg-track flex h-2.5 gap-0.5 overflow-hidden rounded-full"
                  role="img"
                  aria-label={`${formatMoney(m.collected)} collected, ${formatMoney(m.overdue)} overdue, ${formatMoney(m.notDue)} not due yet`}
                >
                  {m.collected > 0 && (
                    <div className="bg-good rounded-full" style={{ flexGrow: m.collected }} />
                  )}
                  {m.overdue > 0 && (
                    <div className="bg-bad rounded-full" style={{ flexGrow: m.overdue }} />
                  )}
                  {m.notDue > 0 && <div style={{ flexGrow: m.notDue }} />}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">
                  No charges yet. Generate them on the charges page.
                </span>
              )}
              {m.billed > 0 && (
                <span className="flex items-baseline gap-3 font-mono text-sm tabular-nums md:justify-end">
                  <span className="text-muted-foreground whitespace-nowrap">
                    <span className="text-foreground">{formatMoney(m.collected)}</span> /{" "}
                    {formatMoney(m.billed)}
                  </span>
                  <span className="w-12 text-right font-semibold">
                    {pct(m.collected, m.billed)}
                  </span>
                </span>
              )}
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leases ending soon</CardTitle>
            <CardAction>
              <Link
                href="/leases"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
              >
                All leases <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {ending.length === 0 ? (
              <p className="text-muted-foreground text-sm">No leases end in the next 60 days.</p>
            ) : (
              <ul className="divide-y">
                {ending.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{l.tenant.fullName}</p>
                      <p className="text-muted-foreground text-sm">
                        {l.unit.label}, {l.unit.property.name}. Ends {formatDate(l.endDate)}.
                      </p>
                    </div>
                    <Badge variant="warn">{daysBetween(today, l.endDate!)} days</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest payments</CardTitle>
            <CardAction>
              <Link
                href="/payments"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
              >
                All payments <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No payments yet.{" "}
                <Link
                  href="/payments"
                  className="text-foreground font-medium underline underline-offset-4"
                >
                  Import a bank statement
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {p.lease?.tenant.fullName ?? p.counterName ?? "Unknown payer"}
                      </p>
                      <p className="text-muted-foreground text-xs">{formatDate(p.bookedOn)}</p>
                    </div>
                    <span className="text-good font-mono text-sm font-semibold tabular-nums">
                      +{formatMoney(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
