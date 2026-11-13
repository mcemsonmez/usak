import { and, count, eq } from "drizzle-orm";
import { AppSidebar } from "@/components/app/app-sidebar";
import { SiteHeader } from "@/components/app/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { db } from "@/db";
import { bankTransaction, maintenanceRequest } from "@/db/schema";
import { loadDebtorRows } from "@/server/billing/debtor-rows";
import { getOrgId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const organizationId = await getOrgId();
  const [debtors, [review], [repairs]] = await Promise.all([
    loadDebtorRows(organizationId),
    db
      .select({ n: count() })
      .from(bankTransaction)
      .where(
        and(
          eq(bankTransaction.organizationId, organizationId),
          eq(bankTransaction.matchStatus, "needs_review"),
        ),
      ),
    db
      .select({ n: count() })
      .from(maintenanceRequest)
      .where(
        and(
          eq(maintenanceRequest.organizationId, organizationId),
          eq(maintenanceRequest.status, "new"),
        ),
      ),
  ]);

  return (
    <TooltipProvider delayDuration={200}>
      <SidebarProvider>
        <AppSidebar counts={{ debtors: debtors.length, review: review.n, repairs: repairs.n }} />
        <SidebarInset className="min-w-0">
          <SiteHeader />
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
