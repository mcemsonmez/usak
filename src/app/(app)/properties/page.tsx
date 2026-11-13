import { asc, eq } from "drizzle-orm";
import Link from "next/link";
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
import { property } from "@/db/schema";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

const typeLabel = { apartment: "Apartment building", house: "House", commercial: "Commercial" };

export default async function PropertiesPage() {
  const organizationId = await getOrgId();
  const properties = await db.query.property.findMany({
    where: eq(property.organizationId, organizationId),
    with: { units: true },
    orderBy: asc(property.name),
  });

  return (
    <>
      <PageHeader
        title="Properties"
        description={`${properties.length} properties`}
        action={{ href: "/properties/new", label: "New property" }}
      />
      <div data-table-card className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Occupied</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((p) => {
              const occupied = p.units.filter((u) => u.status === "occupied").length;
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/properties/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {p.address}, {p.city}
                  </TableCell>
                  <TableCell>{typeLabel[p.type]}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {occupied} / {p.units.length}
                  </TableCell>
                </TableRow>
              );
            })}
            {properties.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                  No properties yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
