import { and, count, desc, eq, gt, sql } from "drizzle-orm";
import { Download } from "lucide-react";
import Link from "next/link";
import { ImportDropzone } from "@/components/forms/import-dropzone";
import { ManualMatchForm } from "@/components/forms/manual-match-form";
import { MatchStatusBadge } from "@/components/match-status-badge";
import { PageHeader } from "@/components/page-header";
import { SmartBadge } from "@/components/smart-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { bankTransaction, lease } from "@/db/schema";
import { formatDate, todayIso } from "@/lib/dates";
import { leasePhase } from "@/lib/leases";
import { formatMoney } from "@/lib/money";
import { formatPeriod } from "@/lib/periods";
import { cn } from "@/lib/utils";
import { periodOf } from "@/server/billing/charges";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "all", label: "All" },
  { key: "needs_review", label: "Needs review" },
  { key: "matched", label: "Matched" },
  { key: "partial", label: "Partial" },
  { key: "overpaid", label: "Overpaid" },
  { key: "unmatched", label: "Ignored" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === sp.status) ? (sp.status as TabKey) : "all";
  const organizationId = await getOrgId();
  const today = todayIso();
  const month = periodOf(today);

  const [transactions, leases, counts, batches] = await Promise.all([
    db.query.bankTransaction.findMany({
      where: and(
        eq(bankTransaction.organizationId, organizationId),
        tab === "all" ? undefined : eq(bankTransaction.matchStatus, tab),
      ),
      with: { allocations: true, lease: { with: { tenant: true, unit: true } } },
      orderBy: [desc(bankTransaction.bookedOn), desc(bankTransaction.createdAt)],
    }),
    db.query.lease.findMany({
      where: eq(lease.organizationId, organizationId),
      with: { tenant: true, unit: true },
    }),
    db
      .select({ status: bankTransaction.matchStatus, n: count() })
      .from(bankTransaction)
      .where(eq(bankTransaction.organizationId, organizationId))
      .groupBy(bankTransaction.matchStatus),
    db
      .select({
        id: bankTransaction.importBatchId,
        importedAt: sql<Date>`min(${bankTransaction.createdAt})`,
        rows: count(),
        from: sql<string>`min(${bankTransaction.bookedOn})`,
        to: sql<string>`max(${bankTransaction.bookedOn})`,
        matched: sql<number>`count(*) filter (where ${bankTransaction.matchStatus} in ('matched','overpaid','partial'))::int`,
        review: sql<number>`count(*) filter (where ${bankTransaction.matchStatus} = 'needs_review')::int`,
      })
      .from(bankTransaction)
      .where(eq(bankTransaction.organizationId, organizationId))
      .groupBy(bankTransaction.importBatchId)
      .orderBy(desc(sql`min(${bankTransaction.createdAt})`))
      .limit(5),
  ]);

  const [received] = await db
    .select({ sum: sql<number>`coalesce(sum(${bankTransaction.amount}), 0)::bigint` })
    .from(bankTransaction)
    .where(
      and(
        eq(bankTransaction.organizationId, organizationId),
        gt(bankTransaction.amount, 0),
        sql`to_char(${bankTransaction.bookedOn}, 'YYYY-MM') = ${month}`,
      ),
    );

  const n = Object.fromEntries(counts.map((c) => [c.status, c.n])) as Partial<
    Record<string, number>
  >;
  const total = counts.reduce((s, c) => s + c.n, 0);
  const incoming = total - (n.unmatched ?? 0);
  const auto = (n.matched ?? 0) + (n.partial ?? 0) + (n.overpaid ?? 0);
  const leaseOptions = leases
    .filter((l) => leasePhase(l, today) !== "ended")
    .map((l) => ({
      value: l.id,
      label: `${l.tenant.fullName}, ${l.unit.label} (VS ${l.variableSymbol})`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <PageHeader
        title="Payments"
        description="Import your bank statement. Each incoming payment is matched to the lease it pays."
        actions={
          <Button asChild variant="outline">
            <a href="/api/sample-statement" download>
              <Download /> Sample statement
            </a>
          </Button>
        }
      />

      <div className="grid gap-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Import a bank statement
                <SmartBadge
                  kind="auto"
                  tip="Every incoming payment is matched to its lease automatically: by variable symbol, then by the payer's usual account and amount."
                />
              </CardTitle>
              <CardDescription>
                Export the movements as CSV from internet banking. Importing the same file twice is
                safe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportDropzone />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent imports</CardTitle>
              <CardDescription>Each file you imported, newest first</CardDescription>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nothing imported yet.</p>
              ) : (
                <ul className="grid gap-2">
                  {batches.map((b) => (
                    <li key={b.id} className="bg-muted/40 grid gap-1.5 rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">
                          {formatDate(String(b.from))} to {formatDate(String(b.to))}
                        </span>
                        <span className="text-muted-foreground font-mono text-xs">
                          {b.rows} rows
                        </span>
                      </div>
                      <div className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
                        <span>
                          Imported{" "}
                          {new Date(b.importedAt).toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-good">{b.matched} matched</span>
                        {b.review > 0 && <span className="text-bad">{b.review} to review</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <section aria-label="Payment figures" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: `Received in ${formatPeriod(month)}`,
              value: formatMoney(Number(received.sum)),
              cls: "text-good",
            },
            {
              label: "Matched automatically",
              value: incoming ? `${Math.round((auto / incoming) * 100)}%` : "0%",
              cls: "",
            },
            {
              label: "Needs review",
              value: String(n.needs_review ?? 0),
              cls: n.needs_review ? "text-bad" : "",
            },
            {
              label: "Outgoing, ignored",
              value: String(n.unmatched ?? 0),
              cls: "text-muted-foreground",
            },
          ].map((f) => (
            <div key={f.label} className="bg-card rounded-xl border p-4">
              <p className="text-muted-foreground text-xs">{f.label}</p>
              <p
                className={cn(
                  "mt-1 font-mono text-2xl font-semibold tracking-tight tabular-nums",
                  f.cls,
                )}
              >
                {f.value}
              </p>
            </div>
          ))}
        </section>

        <div className="grid gap-3">
          <nav
            aria-label="Filter by status"
            className="bg-muted/50 flex w-fit flex-wrap gap-1 rounded-lg border p-1"
          >
            {TABS.map((t) => {
              const c = t.key === "all" ? total : (n[t.key] ?? 0);
              const active = t.key === tab;
              return (
                <Link
                  key={t.key}
                  href={t.key === "all" ? "/payments" : `/payments?status=${t.key}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors duration-(--dur-micro)",
                    active
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "rounded px-1.5 font-mono text-xs tabular-nums",
                      t.key === "needs_review" && c > 0 ? "bg-bad-soft text-bad" : "bg-muted",
                    )}
                  >
                    {c}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From / to</TableHead>
                  <TableHead>Variable symbol, message</TableHead>
                  <TableHead>Paid for</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => {
                  const allocated = t.allocations.reduce((s, a) => s + a.amount, 0);
                  return (
                    <TableRow
                      key={t.id}
                      className={t.matchStatus === "needs_review" ? "bg-bad-soft/40" : undefined}
                    >
                      <TableCell className="whitespace-nowrap">{formatDate(t.bookedOn)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{t.counterName ?? "Bank"}</div>
                        <div className="text-muted-foreground font-mono text-xs">
                          {t.counterAccount ?? "fee"}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-64">
                        <div className="font-mono text-sm">{t.variableSymbol ?? "no symbol"}</div>
                        <div className="text-muted-foreground truncate text-xs">{t.message}</div>
                      </TableCell>
                      <TableCell>
                        {t.matchStatus === "needs_review" ? (
                          <ManualMatchForm transactionId={t.id} leases={leaseOptions} />
                        ) : t.lease ? (
                          <div>
                            <div>
                              {t.lease.tenant.fullName}, {t.lease.unit.label}
                            </div>
                            {t.matchStatus === "overpaid" && (
                              <div className="text-good text-xs">
                                +{formatMoney(t.amount - allocated)} credit
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not rent</span>
                        )}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono tabular-nums",
                          t.amount > 0 ? "text-good" : "text-muted-foreground",
                        )}
                      >
                        {t.amount > 0 ? "+" : ""}
                        {formatMoney(t.amount)}
                      </TableCell>
                      <TableCell>
                        <MatchStatusBadge status={t.matchStatus} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                      {tab === "all"
                        ? "No payments yet. Import a bank statement above."
                        : "Nothing here."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}
