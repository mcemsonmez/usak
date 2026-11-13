import { asc, eq } from "drizzle-orm";
import { LeaseImport } from "@/components/forms/lease-import";
import { PageHeader } from "@/components/page-header";
import { SmartBadge } from "@/components/smart-badge";
import { db } from "@/db";
import { property, tenant } from "@/db/schema";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function LeaseImportPage() {
  const organizationId = await getOrgId();
  const [properties, tenants] = await Promise.all([
    db.query.property.findMany({
      where: eq(property.organizationId, organizationId),
      with: { units: true },
      orderBy: asc(property.name),
    }),
    db
      .select({ id: tenant.id, fullName: tenant.fullName })
      .from(tenant)
      .where(eq(tenant.organizationId, organizationId))
      .orderBy(asc(tenant.fullName)),
  ]);
  const units = properties.flatMap((p) =>
    p.units.map((u) => ({
      id: u.id,
      label: u.label,
      propertyName: p.name,
      address: p.address,
      vacant: u.status === "vacant",
    })),
  );

  return (
    <>
      <PageHeader
        title="Import lease with AI"
        actions={
          <SmartBadge
            kind="ai"
            tip="An AI vision model reads the document. Nothing is saved until you approve the form."
          />
        }
        description="Upload a signed lease. A vision model reads it, you check the details, then it is saved."
      />
      <LeaseImport units={units} tenants={tenants} />
    </>
  );
}
