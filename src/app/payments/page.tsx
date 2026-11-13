import { and, desc, eq } from "drizzle-orm";
import { ImportStatementForm } from "@/components/forms/import-statement-form";
import { ManualMatchForm } from "@/components/forms/manual-match-form";
import { MatchStatusBadge } from "@/components/match-status-badge";
import { PageHeader } from "@/components/page-header";
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
import { periodOf } from "@/server/billing/charges";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const organizationId = await getOrgId();
  const today = todayIso();
  const [transactions, leases] = await Promise.all([
    db.query.bankTransaction.findMany({
      where: eq(bankTransaction.organizationId, organizationId),
      with: { allocations: true, lease: { with: { tenant: true, unit: true } } },
      orderBy: [desc(bankTransaction.bookedOn), desc(bankTransaction.createdAt)],
    }),
    db.query.lease.findMany({
      where: and(eq(lease.organizationId, organizationId)),
      with: { tenant: true, unit: { with: { property: true } } },
    }),
  ]);

  const review = transactions.filter((t) => t.matchStatus === "needs_review");
  const leaseOptions = leases
    .filter((l) => leasePhase(l, today) !== "ended")
    .map((l) => ({
      value: l.id,
      label: `${l.tenant.fullName} · ${l.unit.label} (VS ${l.variableSymbol})`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <PageHeader
        title="Payments"
        description="Import bank statements; payments are matched to charges automatically."
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Import bank statement</CardTitle>
            <CardDescription>
              CSV from any bank (Czech formats supported). Importing the same file twice is safe.{" "}
              <a href="/api/sample-statement" className="underline">
                Download a sample statement for {formatPeriod(periodOf(today))}
              </a>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportStatementForm />
          </CardContent>
        </Card>

        {review.length > 0 && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle>Needs review ({review.length})</CardTitle>
              <CardDescription>These payments could not be matched automatically.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>VS / message</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Match</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {review.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(t.bookedOn)}</TableCell>
                      <TableCell>
                        <div>{t.counterName ?? "—"}</div>
                        <div className="text-muted-foreground text-xs">{t.counterAccount}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{t.variableSymbol ?? "no VS"}</div>
                        <div className="text-muted-foreground text-xs">{t.message}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(t.amount)}
                      </TableCell>
                      <TableCell>
                        <ManualMatchForm transactionId={t.id} leases={leaseOptions} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Transactions ({transactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>VS</TableHead>
                  <TableHead>Matched to</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Allocated</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => {
                  const allocated = t.allocations.reduce((s, a) => s + a.amount, 0);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(t.bookedOn)}</TableCell>
                      <TableCell>
                        <div>{t.counterName ?? t.message ?? "—"}</div>
                        <div className="text-muted-foreground text-xs">{t.counterAccount}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{t.variableSymbol ?? "—"}</TableCell>
                      <TableCell>
                        {t.lease ? `${t.lease.tenant.fullName} · ${t.lease.unit.label}` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(t.amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {t.amount > 0 ? formatMoney(allocated) : "—"}
                        {t.matchStatus === "overpaid" && (
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            +{formatMoney(t.amount - allocated)} credit
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <MatchStatusBadge status={t.matchStatus} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                      No transactions yet. Import a bank statement above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
