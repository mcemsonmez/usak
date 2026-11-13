import { asc, eq } from "drizzle-orm";
import { LeaseForm } from "@/components/forms/lease-form";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { property, tenant } from "@/db/schema";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function NewLeasePage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  const { unit: defaultUnitId } = await searchParams;
  const organizationId = await getOrgId();
  const [properties, tenants] = await Promise.all([
    db.query.property.findMany({
      where: eq(property.organizationId, organizationId),
      with: { units: true },
      orderBy: asc(property.name),
    }),
    db.query.tenant.findMany({
      where: eq(tenant.organizationId, organizationId),
      orderBy: asc(tenant.fullName),
    }),
  ]);

  const unitOptions = properties.flatMap((p) =>
    p.units.map((u) => ({
      value: u.id,
      label: `${p.name} · ${u.label}${u.status === "vacant" ? " (vacant)" : ""}`,
    })),
  );
  const tenantOptions = tenants.map((t) => ({ value: t.id, label: t.fullName }));

  return (
    <>
      <PageHeader title="New lease" />
      <LeaseForm units={unitOptions} tenants={tenantOptions} defaultUnitId={defaultUnitId} />
    </>
  );
}
