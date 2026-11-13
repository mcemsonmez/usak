import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddUnitButton } from "@/components/forms/add-unit-button";
import { LeaseBadge } from "@/components/lease-badge";
import { MarketRentRow } from "@/components/market-rent-row";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { property, unit } from "@/db/schema";
import { todayIso } from "@/lib/dates";
import { currentLease, leasePhase } from "@/lib/leases";
import { formatMoney } from "@/lib/money";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const organizationId = await getOrgId();
  const p = await db.query.property.findFirst({
    where: and(eq(property.id, id), eq(property.organizationId, organizationId)),
    with: {
      units: {
        orderBy: asc(unit.label),
        with: { leases: { with: { tenant: true } } },
      },
    },
  });
  if (!p) notFound();
  const today = todayIso();

  return (
    <>
      <PageHeader title={p.name} description={`${p.address}, ${p.city}`} />
      <Card>
        <CardHeader>
          <CardTitle>Units</CardTitle>
          <CardAction>
            <AddUnitButton propertyId={p.id} />
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Layout</TableHead>
                <TableHead className="text-right">Area</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead className="text-right">Rent</TableHead>
                <TableHead>Lease</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {p.units.map((u) => {
                const l = currentLease(u.leases, today);
                return (
                  <MarketRentRow
                    key={u.id}
                    unitId={u.id}
                    currentRent={l?.rentAmount ?? null}
                    colSpan={7}
                    cells={
                      <>
                        <TableCell className="font-medium">{u.label}</TableCell>
                        <TableCell>{u.rooms ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {u.areaM2 ? `${u.areaM2} m²` : "—"}
                        </TableCell>
                        <TableCell>
                          {l?.tenant.fullName ?? <Badge variant="outline">Vacant</Badge>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {l ? formatMoney(l.rentAmount) : "—"}
                        </TableCell>
                        <TableCell>
                          {l ? (
                            <LeaseBadge
                              phase={leasePhase(l, today)}
                              endDate={l.endDate}
                              today={today}
                            />
                          ) : (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/leases/new?unit=${u.id}`}>New lease</Link>
                            </Button>
                          )}
                        </TableCell>
                      </>
                    }
                  />
                );
              })}
              {p.units.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                    No units yet. Use “Add unit” to add the flats, lofts or shops in this property.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
