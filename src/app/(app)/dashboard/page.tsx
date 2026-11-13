import { and, count, desc, eq, gt, gte } from "drizzle-orm";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { AnimatedNumber } from "@/components/animated-number";
import { type ActivityItem, ActivityFeed } from "@/components/dashboard/activity-feed";
import { type CollectionPoint, CollectionsChart } from "@/components/dashboard/collections-chart";
import { Stagger, StaggerItem } from "@/components/dashboard/motion";
import { OccupancyChart } from "@/components/dashboard/occupancy-chart";
import { ReminderBadge } from "@/components/reminder-badge";
import { StatTile } from "@/components/stat-tile";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import {
  bankTransaction,
  charge,
  lease,
  maintenanceRequest,
  paymentAllocation,
  unit,
} from "@/db/schema";
import { daysBetween, formatDate, todayIso } from "@/lib/dates";
import { leasePhase } from "@/lib/leases";
import { formatMoney } from "@/lib/money";
import { formatPeriod } from "@/lib/periods";
import { periodOf, shiftPeriod } from "@/server/billing/charges";
import { loadDebtorRows } from "@/server/billing/debtor-rows";
import { loadChargesWithPaid } from "@/server/billing/queries";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const addDays = (iso: string, n: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

export default async function Dashboard() {
  const organizationId = await getOrgId();
  const today = todayIso();
  const current = periodOf(today);
  const first = shiftPeriod(current, -2);

  const [charges, debtors, units, leases, [review], repairs, allocations, payments] =
    await Promise.all([
      loadChargesWithPaid(organizationId, first),
      loadDebtorRows(organizationId),
      db.query.unit.findMany({
        where: eq(unit.organizationId, organizationId),
        with: { property: true },
      }),
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
      db.query.maintenanceRequest.findMany({
        where: eq(maintenanceRequest.organizationId, organizationId),
        with: { unit: { with: { property: true } } },
        orderBy: desc(maintenanceRequest.createdAt),
        limit: 5,
      }),
      db
        .select({ amount: paymentAllocation.amount, bookedOn: bankTransaction.bookedOn })
        .from(paymentAllocation)
        .innerJoin(bankTransaction, eq(bankTransaction.id, paymentAllocation.bankTransactionId))
        .innerJoin(charge, eq(charge.id, paymentAllocation.chargeId))
        .where(
          and(eq(paymentAllocation.organizationId, organizationId), gte(charge.period, first)),
        ),
      db.query.bankTransaction.findMany({
        where: and(
          eq(bankTransaction.organizationId, organizationId),
          gt(bankTransaction.amount, 0),
        ),
        with: { lease: { with: { tenant: true, unit: true } } },
        orderBy: [desc(bankTransaction.bookedOn), desc(bankTransaction.createdAt)],
        limit: 6,
      }),
    ]);

  // Month figures
  const monthStats = (period: string) => {
    const list = charges.filter((c) => c.period === period);
    const billed = list.reduce((s, c) => s + c.amount, 0);
    const collected = list.reduce((s, c) => s + Math.min(c.paid, c.amount), 0);
    return { billed, collected };
  };
  const thisMonth = monthStats(current);
  const lastMonth = monthStats(shiftPeriod(current, -1));
  const overdueTotal = debtors.reduce((s, d) => s + d.overdue, 0);
  const occupied = units.filter((u) => u.status === "occupied").length;
  const newRepairs = repairs.filter((r) => r.status === "new").length;

  // Daily running totals for the chart, from the 1st of the first month to today.
  const series: CollectionPoint[] = [];
  const span = daysBetween(`${first}-01`, today);
  for (let i = 0; i <= span; i++) {
    const day = addDays(`${first}-01`, i);
    series.push({
      date: day,
      expected: charges.filter((c) => c.dueDate <= day).reduce((s, c) => s + c.amount, 0) / 100,
      collected:
        allocations.filter((a) => a.bookedOn <= day).reduce((s, a) => s + a.amount, 0) / 100,
    });
  }

  // Activity feed
  const activity: (ActivityItem & { sort: string })[] = [
    ...payments.map((p) => ({
      id: `p-${p.id}`,
      kind: "payment" as const,
      title: p.lease
        ? `${p.lease.tenant.fullName} paid`
        : `${p.counterName ?? "Unknown payer"} paid`,
      detail: p.lease ? p.lease.unit.label : "not matched yet",
      when: formatDate(p.bookedOn),
      href: "/payments",
      amount: `+${formatMoney(p.amount)}`,
      sort: p.bookedOn,
    })),
    ...repairs.map((r) => ({
      id: `r-${r.id}`,
      kind: "repair" as const,
      title: r.description,
      detail: `${r.unit.property.name}, ${r.unit.label}`,
      when: formatDate(r.createdAt.toISOString().slice(0, 10)),
      href: "/maintenance",
      sort: r.createdAt.toISOString().slice(0, 10),
    })),
    ...leases
      .filter((l) => l.startDate >= `${first}-01`)
      .map((l) => ({
        id: `l-${l.id}`,
        kind: "lease" as const,
        title: `New lease: ${l.tenant.fullName}`,
        detail: `${l.unit.property.name}, ${l.unit.label}`,
        when: `starts ${formatDate(l.startDate)}`,
        href: "/leases",
        sort: l.startDate,
      })),
  ]
    .sort((a, b) => b.sort.localeCompare(a.sort))
    .slice(0, 7);

  const ending = leases
    .filter((l) => leasePhase(l, today) === "ending_soon")
    .sort((a, b) => (a.endDate! < b.endDate! ? -1 : 1));
  const shown = debtors.slice(0, 3);

  return (
    <Stagger className="grid gap-5">
      <StaggerItem className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">{formatPeriod(current)}</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Good morning, here is your rent.
          </h1>
        </div>
      </StaggerItem>

      {/* Signature: who owes, answered first */}
      <StaggerItem>
        <section
          aria-labelledby="answer"
          className="from-brand-soft via-card to-card border-brand/25 relative isolate grid overflow-hidden rounded-2xl border bg-gradient-to-br lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
        >
          <div
            aria-hidden
            className="bg-brand/20 absolute -top-24 -left-20 -z-10 size-72 rounded-full blur-[100px]"
          />
          <div className="grid content-between gap-6 p-6 sm:p-8">
            <span className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
              <span
                aria-hidden
                className="live-dot text-brand relative inline-flex size-2 rounded-full bg-current"
              />
              Live from your bank imports
            </span>
            <h2 id="answer" className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Who owes?
            </h2>
            <p className="text-muted-foreground text-sm">
              {debtors.length === 0
                ? "Nobody is late."
                : `${debtors.length} tenant${debtors.length === 1 ? "" : "s"} past the due date, `}
              {debtors.length > 0 && (
                <span className="text-foreground">{formatMoney(overdueTotal)} in total</span>
              )}
            </p>
          </div>
          <div className="border-t lg:border-t-0 lg:border-l">
            {shown.length === 0 ? (
              <p className="p-6 text-2xl font-semibold sm:p-8">
                Everyone has paid. Nothing to chase.
              </p>
            ) : (
              <ul className="divide-y">
                {shown.map((d) => (
                  <li key={d.leaseId}>
                    <Link
                      href="/debtors"
                      className="group grid gap-2 px-6 py-5 transition-colors duration-(--dur-micro) hover:bg-white/[0.03] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-8"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold">{d.lease.tenant.fullName}</p>
                        <p className="text-muted-foreground text-sm">
                          {d.lease.unit.label}, {d.lease.unit.property.name}. {d.daysOverdue} days
                          late.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 sm:justify-end">
                        <ReminderBadge level={d.level} />
                        <span className="text-brand font-mono text-3xl font-semibold tracking-tight tabular-nums">
                          <AnimatedNumber kind="money" value={d.overdue} />
                        </span>
                        <ArrowUpRight
                          className="text-muted-foreground size-4 transition-transform duration-(--dur-short) group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </StaggerItem>

      <section aria-label="Key figures" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StaggerItem>
          <StatTile
            label="Collected this month"
            value={<AnimatedNumber kind="money" value={thisMonth.collected} />}
            detail={
              thisMonth.billed
                ? `${pct(thisMonth.collected, thisMonth.billed)}% of ${formatMoney(thisMonth.billed)} billed`
                : "No charges generated yet"
            }
            chip={
              lastMonth.billed
                ? {
                    text: `${pct(lastMonth.collected, lastMonth.billed)}% in ${formatPeriod(shiftPeriod(current, -1)).split(" ")[0].slice(0, 3)}`,
                    up: true,
                  }
                : undefined
            }
            href={`/charges?period=${current}`}
            tone={thisMonth.collected > 0 ? "good" : "none"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Overdue"
            value={<AnimatedNumber kind="money" value={overdueTotal} />}
            detail={`${debtors.length} tenant${debtors.length === 1 ? "" : "s"} late`}
            chip={debtors.length ? { text: `${debtors.length} late`, up: false } : undefined}
            href="/debtors"
            tone={overdueTotal > 0 ? "bad" : "none"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Payments to review"
            value={<AnimatedNumber value={review.n} />}
            detail="Could not be matched automatically"
            href="/payments"
            tone={review.n > 0 ? "warn" : "none"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="New repairs"
            value={<AnimatedNumber value={newRepairs} />}
            detail="Waiting for a repairer"
            href="/maintenance"
            tone={newRepairs > 0 ? "warn" : "none"}
          />
        </StaggerItem>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <StaggerItem className="min-w-0">
          <CollectionsChart data={series} />
        </StaggerItem>
        <StaggerItem>
          <OccupancyChart
            occupied={occupied}
            total={units.length}
            byProperty={Object.values(
              units.reduce<Record<string, { name: string; occupied: number; total: number }>>(
                (acc, u) => {
                  const k = u.property.name;
                  acc[k] ??= { name: k, occupied: 0, total: 0 };
                  acc[k].total++;
                  if (u.status === "occupied") acc[k].occupied++;
                  return acc;
                },
                {},
              ),
            )}
          />
        </StaggerItem>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <StaggerItem>
          <ActivityFeed items={activity} />
        </StaggerItem>
        <StaggerItem>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Leases ending soon</CardTitle>
              <CardDescription>Renew or find a new tenant</CardDescription>
              <CardAction>
                <Link
                  href="/leases"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
                >
                  All <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent>
              {ending.length === 0 ? (
                <p className="text-muted-foreground text-sm">No leases end in the next 60 days.</p>
              ) : (
                <ul className="grid gap-2">
                  {ending.map((l) => {
                    const left = daysBetween(today, l.endDate!);
                    return (
                      <li key={l.id} className="bg-muted/40 grid gap-2 rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-medium">{l.tenant.fullName}</p>
                          <Badge variant="warn">{left} days</Badge>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {l.unit.label}, {l.unit.property.name}. Ends {formatDate(l.endDate)}.
                        </p>
                        <div className="bg-track h-1.5 overflow-hidden rounded-full">
                          <div
                            className="grow-x bg-warn h-full rounded-full"
                            style={{ width: `${Math.max(4, 100 - (left / 60) * 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </StaggerItem>
      </div>
    </Stagger>
  );
}
