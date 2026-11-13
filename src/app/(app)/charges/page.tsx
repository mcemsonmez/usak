import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { ChargeStatusBadge } from "@/components/charge-status-badge";
import { GenerateChargesButton } from "@/components/forms/generate-charges-button";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { charge } from "@/db/schema";
import { formatDate, todayIso } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { formatPeriod } from "@/lib/periods";
import { isPeriod, periodOf, shiftPeriod } from "@/server/billing/charges";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

const typeLabel = { rent: "Rent", service_charge: "Service charges", deposit: "Deposit" };

export default async function ChargesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const today = todayIso();
  const sp = await searchParams;
  const period = sp.period && isPeriod(sp.period) ? sp.period : periodOf(today);
  const organizationId = await getOrgId();

  const charges = await db.query.charge.findMany({
    where: and(eq(charge.organizationId, organizationId), eq(charge.period, period)),
    with: {
      lease: { with: { tenant: true, unit: { with: { property: true } } } },
      allocations: true,
    },
    orderBy: [asc(charge.dueDate)],
  });

  const rows = charges
    .map((c) => ({ ...c, paid: c.allocations.reduce((s, a) => s + a.amount, 0) }))
    .sort((a, b) =>
      `${a.lease.unit.property.name}${a.lease.unit.label}${a.type}`.localeCompare(
        `${b.lease.unit.property.name}${b.lease.unit.label}${b.type}`,
      ),
    );
  const total = rows.reduce((s, c) => s + c.amount, 0);
  const paid = rows.reduce((s, c) => s + Math.min(c.paid, c.amount), 0);

  return (
    <>
      <PageHeader
        title={`Charges · ${formatPeriod(period)}`}
        description={
          rows.length
            ? `${rows.length} charges · ${formatMoney(total)} billed · ${formatMoney(paid)} paid`
            : "No charges for this month yet."
        }
      />
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/charges?period=${shiftPeriod(period, -1)}`}>
              ← {formatPeriod(shiftPeriod(period, -1))}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/charges?period=${shiftPeriod(period, 1)}`}>
              {formatPeriod(shiftPeriod(period, 1))} →
            </Link>
          </Button>
        </div>
        <GenerateChargesButton period={period} label={formatPeriod(period)} />
      </div>
      <div data-table-card className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium">{c.lease.unit.label}</div>
                  <div className="text-muted-foreground text-xs">{c.lease.unit.property.name}</div>
                </TableCell>
                <TableCell>{c.lease.tenant.fullName}</TableCell>
                <TableCell>{typeLabel[c.type]}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(c.dueDate)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(c.amount)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(c.paid)}</TableCell>
                <TableCell>
                  <ChargeStatusBadge
                    status={c.status}
                    overdue={c.status !== "paid" && c.dueDate < today}
                  />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-12 text-center">
                  No charges for {formatPeriod(period)} yet. Use “Generate charges” to create them
                  from the active leases.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
