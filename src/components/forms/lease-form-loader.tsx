import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { property, tenant } from "@/db/schema";
import { getOrgId } from "@/server/org";
import { LeaseForm } from "./lease-form";

/** Server wrapper: loads units and tenants for the lease form (page and modal). */
export async function LeaseFormLoader({ defaultUnitId }: { defaultUnitId?: string }) {
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
  const units = properties.flatMap((p) =>
    p.units.map((u) => ({
      value: u.id,
      label: `${p.name}, ${u.label}${u.status === "vacant" ? " (vacant)" : ""}`,
    })),
  );
  return (
    <LeaseForm
      units={units}
      tenants={tenants.map((t) => ({ value: t.id, label: t.fullName }))}
      defaultUnitId={defaultUnitId}
    />
  );
}
