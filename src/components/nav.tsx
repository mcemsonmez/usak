"use client";

import {
  Building2,
  FileText,
  HandCoins,
  LayoutDashboard,
  Landmark,
  Receipt,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/leases", label: "Leases", icon: FileText },
  { href: "/charges", label: "Charges", icon: Receipt },
  { href: "/payments", label: "Payments", icon: Landmark },
  { href: "/debtors", label: "Debtors", icon: HandCoins },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-white">
      <span className="bg-lime text-ink grid size-7 place-content-center rounded-md text-sm font-bold">
        u
      </span>
      <span className="text-[15px] font-semibold tracking-tight">usak</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Desktop */}
      <aside className="bg-ink sticky top-0 hidden h-dvh flex-col gap-8 px-3 py-5 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav aria-label="Main" className="grid gap-0.5">
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-(--dur-micro)",
                  active
                    ? "bg-ink-2 text-white"
                    : "text-sidebar-muted hover:bg-ink-2/60 hover:text-white",
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="bg-lime absolute inset-y-1.5 -left-3 w-1 rounded-r"
                  />
                )}
                <Icon className={cn("size-4", active ? "text-lime" : "")} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="text-sidebar-muted mt-auto border-t border-white/10 px-2 pt-4 text-xs">
          <p className="font-medium text-white">Demo Properties s.r.o.</p>
          <p>Prague, CZK</p>
        </div>
      </aside>

      {/* Mobile */}
      <header className="bg-ink sticky top-0 z-10 lg:hidden">
        <div className="flex items-center gap-4 px-4 py-3">
          <Logo />
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-3">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap",
                isActive(href) ? "bg-lime text-ink" : "text-sidebar-muted",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
