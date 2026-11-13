import { desc, eq } from "drizzle-orm";
import { LeaseBadge } from "@/components/lease-badge";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { lease } from "@/db/schema";
import { formatDate, todayIso } from "@/lib/dates";
import { leasePhase } from "@/lib/leases";
import { formatMoney } from "@/lib/money";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function LeasesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  const organizationId = await getOrgId();
  const leases = await db.query.lease.findMany({
    where: eq(lease.organizationId, organizationId),
    with: { tenant: true, unit: { with: { property: true } } },
    orderBy: desc(lease.startDate),
  });
  const today = todayIso();
  const monthly = leases
    .filter((l) => leasePhase(l, today) !== "ended" && l.startDate <= today)
    .reduce((sum, l) => sum + l.rentAmount + l.serviceChargeAmount, 0);

  return (
    <>
      <PageHeader
        title="Leases"
        description={`${leases.length} leases · ${formatMoney(monthly)} expected per month (rent + service charges)`}
        action={{ href: "/leases/new", label: "New lease" }}
        secondaryAction={{ href: "/leases/import", label: "Import with AI" }}
      />
      {created && (
        <p
          role="status"
          className="mb-4 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
        >
          Lease saved. Variable symbol for payments: <span className="font-mono">{created}</span>
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Rent</TableHead>
            <TableHead className="text-right">Service</TableHead>
            <TableHead className="text-right">Due day</TableHead>
            <TableHead>Var. symbol</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leases.map((l) => (
            <TableRow key={l.id}>
              <TableCell>
                <div className="font-medium">{l.unit.label}</div>
                <div className="text-muted-foreground text-xs">{l.unit.property.name}</div>
              </TableCell>
              <TableCell>{l.tenant.fullName}</TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {formatDate(l.startDate)} – {l.endDate ? formatDate(l.endDate) : "indefinite"}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatMoney(l.rentAmount)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(l.serviceChargeAmount)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{l.dueDay}.</TableCell>
              <TableCell className="font-mono text-sm">{l.variableSymbol}</TableCell>
              <TableCell>
                <LeaseBadge phase={leasePhase(l, today)} endDate={l.endDate} today={today} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
