"use client";

import { ArrowUpRight, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { activeHref, NAV_GROUPS, QUICK_ACTIONS } from "./nav-items";

export type SidebarCounts = { debtors: number; review: number; repairs: number };

export function AppSidebar({ counts }: { counts: SidebarCounts }) {
  const pathname = usePathname();
  const active = activeHref(pathname);

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="usak">
              <Link href="/dashboard">
                <span className="bg-lime text-ink grid size-8 shrink-0 place-content-center rounded-lg text-sm font-bold">
                  u
                </span>
                <span className="grid leading-tight">
                  <span className="font-semibold">Demo Properties</span>
                  <span className="text-sidebar-foreground/60 text-xs">Prague, CZK</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip="Quick create"
                  className="bg-lime text-ink hover:bg-lime-strong hover:text-ink active:bg-lime-strong data-[state=open]:bg-lime-strong font-medium"
                >
                  <Plus />
                  <span>Quick create</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel>Create</DropdownMenuLabel>
                {QUICK_ACTIONS.map((a) => (
                  <DropdownMenuItem key={a.label} asChild>
                    <Link href={a.href}>{a.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const count = item.badgeKey ? counts[item.badgeKey] : 0;
                  const isActive = active === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                          <item.icon className={isActive ? "text-lime" : undefined} />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {count > 0 && (
                        <SidebarMenuBadge
                          className={
                            item.badgeKey === "debtors"
                              ? "bg-bad-soft text-bad"
                              : "bg-warn-soft text-warn-ink"
                          }
                        >
                          {count}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip="Account">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="bg-sidebar-accent rounded-lg text-xs">
                      DP
                    </AvatarFallback>
                  </Avatar>
                  <span className="grid flex-1 leading-tight">
                    <span className="font-medium">Landlord</span>
                    <span className="text-sidebar-foreground/60 text-xs">demo account</span>
                  </span>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <DropdownMenuLabel>Demo Properties s.r.o.</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">
                    Back to the website <ArrowUpRight className="ml-auto" />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
