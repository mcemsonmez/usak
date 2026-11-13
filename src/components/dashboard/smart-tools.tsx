import { ArrowUpRight, Bot, Landmark, Search, TrendingUp } from "lucide-react";
import Link from "next/link";
import { InfoTip } from "@/components/info-tip";
import { SmartBadge, type SmartKind } from "@/components/smart-badge";

const TOOLS: {
  href: string;
  title: string;
  text: string;
  kind: SmartKind;
  icon: typeof Bot;
  tip: string;
}[] = [
  {
    href: "/leases/import",
    title: "Read a lease with AI",
    text: "Photo of a signed lease in, tenant and lease out.",
    kind: "ai",
    icon: Bot,
    tip: "An AI vision model reads the lease photo and fills in tenant, unit, dates, rent and deposit. You check and approve before it is saved.",
  },
  {
    href: "/payments",
    title: "Auto-match payments",
    text: "Import the bank CSV, rent marks itself paid.",
    kind: "auto",
    icon: Landmark,
    tip: "Each incoming payment is matched by variable symbol, then by the payer's usual account and amount. Short payments clear the oldest debt first.",
  },
  {
    href: "/properties",
    title: "Compare market rent",
    text: "Your rent against live listings nearby.",
    kind: "live",
    icon: TrendingUp,
    tip: "Searches current rental listings in the unit's district and shows the median and the middle half, next to what the tenant pays.",
  },
  {
    href: "/maintenance",
    title: "Find a repairer",
    text: "Rated plumbers and electricians near the flat.",
    kind: "live",
    icon: Search,
    tip: "Searches Google Maps near the property for the right trade, ranks by rating and reviews, and drafts the message to send.",
  },
];

/** Makes the smart features visible on the dashboard. */
export function SmartTools() {
  return (
    <section aria-labelledby="smart-tools" className="grid gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="smart-tools" className="text-lg font-semibold tracking-tight">
          Smart tools
        </h2>
        <p className="text-muted-foreground text-xs">Hover a tool to see what it does</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TOOLS.map((t) => (
          <InfoTip key={t.href} tip={t.tip} side="bottom">
            <Link
              href={t.href}
              className="smart-border group block rounded-xl p-px transition-transform duration-(--dur-short) ease-(--ease-out) hover:-translate-y-0.5"
            >
              <span className="bg-card grid h-full gap-3 rounded-[11px] p-4">
                <span className="flex items-center justify-between">
                  <span className="bg-brand-soft text-brand grid size-9 place-content-center rounded-lg">
                    <t.icon className="size-4" aria-hidden />
                  </span>
                  <SmartBadge kind={t.kind} />
                </span>
                <span>
                  <span className="flex items-center gap-1 font-semibold">
                    {t.title}
                    <ArrowUpRight
                      className="text-muted-foreground size-3.5 transition-transform duration-(--dur-short) group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-sm">{t.text}</span>
                </span>
              </span>
            </Link>
          </InfoTip>
        ))}
      </div>
    </section>
  );
}
