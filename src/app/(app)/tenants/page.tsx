import { asc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { tenant } from "@/db/schema";
import { todayIso } from "@/lib/dates";
import { currentLease } from "@/lib/leases";
import { formatMoney } from "@/lib/money";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const organizationId = await getOrgId();
  const tenants = await db.query.tenant.findMany({
    where: eq(tenant.organizationId, organizationId),
    with: { leases: { with: { unit: { with: { property: true } } } } },
    orderBy: asc(tenant.fullName),
  });
  const today = todayIso();

  return (
    <>
      <PageHeader
        title="Tenants"
        description={`${tenants.length} tenants`}
        action={{ href: "/tenants/new", label: "New tenant" }}
      />
      <div data-table-card className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Rents</TableHead>
              <TableHead className="text-right">Monthly rent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((t) => {
              const l = currentLease(t.leases, today);
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    <span className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-brand-soft text-brand text-xs font-semibold">
                          {t.fullName
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{t.fullName}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{t.email ?? "—"}</div>
                    <div className="text-muted-foreground">{t.phone}</div>
                  </TableCell>
                  <TableCell>{l ? `${l.unit.property.name} · ${l.unit.label}` : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {l ? formatMoney(l.rentAmount) : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
