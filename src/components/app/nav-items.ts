import {
  Bot,
  Building2,
  FileText,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Receipt,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "debtors" | "review" | "repairs";
  ai?: boolean;
};

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Portfolio",
    items: [
      { href: "/properties", label: "Properties", icon: Building2 },
      { href: "/tenants", label: "Tenants", icon: Users },
      { href: "/leases", label: "Leases", icon: FileText },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/charges", label: "Charges", icon: Receipt },
      { href: "/payments", label: "Payments", icon: Landmark, badgeKey: "review" },
      { href: "/debtors", label: "Debtors", icon: HandCoins, badgeKey: "debtors" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/maintenance", label: "Maintenance", icon: Wrench, badgeKey: "repairs" },
      { href: "/leases/import", label: "AI lease import", icon: Bot, ai: true },
    ],
  },
];

export const QUICK_ACTIONS = [
  { href: "/leases/import", label: "Import a lease with AI" },
  { href: "/payments", label: "Import a bank statement" },
  { href: "/leases/new", label: "New lease" },
  { href: "/tenants/new", label: "New tenant" },
  { href: "/properties/new", label: "New property" },
  { href: "/maintenance", label: "Report an issue" },
];

/** Most specific nav item for a path (so /leases/import beats /leases). */
export function activeHref(pathname: string): string | null {
  const all = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
  return (
    all
      .filter((h) => pathname === h || pathname.startsWith(h + "/"))
      .sort((a, b) => b.length - a.length)[0] ?? null
  );
}
