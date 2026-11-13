"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommandMenu } from "./command-menu";
import { ThemeToggle } from "./theme-toggle";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  properties: "Properties",
  tenants: "Tenants",
  leases: "Leases",
  charges: "Charges",
  payments: "Payments",
  debtors: "Debtors",
  maintenance: "Maintenance",
  new: "New",
  import: "AI import",
};

export function SiteHeader({ theme }: { theme: "dark" | "light" }) {
  const parts = usePathname().split("/").filter(Boolean);
  const crumbs = parts.map((p, i) => ({
    href: "/" + parts.slice(0, i + 1).join("/"),
    label: LABELS[p] ?? "Details",
  }));

  return (
    <header className="bg-background/80 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur md:rounded-t-xl">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4!" />
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          {crumbs.map((c, i) => (
            <Fragment key={c.href}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex flex-1 items-center justify-end gap-3">
        <CommandMenu />
        <ThemeToggle initial={theme} />
        <span className="text-muted-foreground hidden items-center gap-2 text-xs lg:flex">
          <span
            aria-hidden
            className="live-dot text-brand relative inline-flex size-2 rounded-full bg-current"
          />
          Live
        </span>
      </div>
    </header>
  );
}
