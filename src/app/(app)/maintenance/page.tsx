import { desc, eq } from "drizzle-orm";
import { ReportIssueButton } from "@/components/forms/report-issue-button";
import { PageHeader } from "@/components/page-header";
import { RepairerFinder } from "@/components/repairer-finder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { maintenanceRequest, property } from "@/db/schema";
import { CATEGORY_OPTIONS } from "@/lib/maintenance";
import { updateMaintenanceStatus } from "@/server/actions/maintenance";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

const statusLabel = { new: "New", in_progress: "In progress", done: "Done" } as const;
const categoryLabel = Object.fromEntries(CATEGORY_OPTIONS.map((o) => [o.value, o.label]));
const next = { new: "in_progress", in_progress: "done", done: null } as const;

export default async function MaintenancePage() {
  const organizationId = await getOrgId();
  const [requests, properties] = await Promise.all([
    db.query.maintenanceRequest.findMany({
      where: eq(maintenanceRequest.organizationId, organizationId),
      with: { unit: { with: { property: true } } },
      orderBy: desc(maintenanceRequest.createdAt),
    }),
    db.query.property.findMany({
      where: eq(property.organizationId, organizationId),
      with: { units: true },
    }),
  ]);
  const unitOptions = properties.flatMap((p) =>
    p.units.map((u) => ({ value: u.id, label: `${p.name} · ${u.label}` })),
  );
  const columns = (["new", "in_progress", "done"] as const).map((status) => ({
    status,
    items: requests.filter((r) => r.status === status),
  }));

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Track issues and find a repairer nearby."
        actions={<ReportIssueButton units={unitOptions} />}
      />
      <div className="grid gap-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {columns.map((col) => (
            <section
              key={col.status}
              aria-label={statusLabel[col.status]}
              className="grid content-start gap-3"
            >
              <h2 className="text-sm font-medium">
                {statusLabel[col.status]}{" "}
                <span className="text-muted-foreground">({col.items.length})</span>
              </h2>
              {col.items.length === 0 && (
                <p className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
                  Nothing here
                </p>
              )}
              {col.items.map((r) => {
                const to = next[r.status];
                return (
                  <Card key={r.id} className="gap-3 py-4">
                    <CardHeader className="px-4">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">
                          {r.unit.property.name} · {r.unit.label}
                        </CardTitle>
                        <Badge variant="outline">{categoryLabel[r.category]}</Badge>
                      </div>
                      <CardDescription>{r.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 px-4">
                      {r.status !== "done" && <RepairerFinder requestId={r.id} />}
                      {to && (
                        <form action={updateMaintenanceStatus}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="status" value={to} />
                          <Button type="submit" size="sm" variant="ghost" className="px-0">
                            Move to {statusLabel[to]} →
                          </Button>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
