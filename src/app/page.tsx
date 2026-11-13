import { count } from "drizzle-orm";
import { db } from "@/db";
import { lease, maintenanceRequest, property, tenant, unit } from "@/db/schema";

export const dynamic = "force-dynamic";

async function getCounts() {
  const tables = { property, unit, tenant, lease, maintenanceRequest };
  const entries = await Promise.all(
    Object.entries(tables).map(async ([name, table]) => {
      const [row] = await db.select({ n: count() }).from(table);
      return [name, row.n] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<keyof typeof tables, number>;
}

export default async function Home() {
  let counts: Awaited<ReturnType<typeof getCounts>> | null = null;
  let error: string | null = null;
  try {
    counts = await getCounts();
  } catch (e) {
    error = e instanceof Error ? e.message : "unknown error";
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">usak</h1>
        <p className="text-muted-foreground">
          Who owes how much, for which property, and have they paid?
        </p>
      </div>
      {error ? (
        <p className="text-sm text-red-600">Database not connected: {error}</p>
      ) : (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ["Properties", counts!.property],
            ["Units", counts!.unit],
            ["Tenants", counts!.tenant],
            ["Leases", counts!.lease],
            ["Maintenance", counts!.maintenanceRequest],
          ].map(([label, n]) => (
            <div key={label} className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className="text-2xl font-semibold">{n}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
