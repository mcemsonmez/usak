import { TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { InfoDot } from "./info-tip";

const tones = { none: "", good: "text-good", bad: "text-bad", warn: "text-warn-ink" } as const;

/** KPI card: label, big figure, an optional trend chip and one line of context. */
export function StatTile({
  label,
  value,
  detail,
  href,
  tone = "none",
  chip,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  detail?: string;
  href: string;
  tone?: keyof typeof tones;
  chip?: { text: string; up: boolean };
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="group from-card to-card bg-card relative grid h-full gap-3 overflow-hidden rounded-xl border bg-gradient-to-t p-5 shadow-xs transition-[transform,border-color,box-shadow] duration-(--dur-short) ease-(--ease-out) hover:-translate-y-0.5 hover:border-white/15 hover:shadow-lg hover:shadow-black/30 dark:from-white/[0.015]"
    >
      <span
        aria-hidden
        className="bg-brand/0 group-hover:bg-brand/10 absolute -top-12 -right-12 size-32 rounded-full blur-2xl transition-colors duration-500"
      />
      <span className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5">
          {label}
          {hint && <InfoDot tip={hint} />}
        </span>
        {chip && (
          <span className="flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap">
            {chip.up ? (
              <TrendingUp className="size-3" aria-hidden />
            ) : (
              <TrendingDown className="size-3" aria-hidden />
            )}
            {chip.text}
          </span>
        )}
      </span>
      <span
        className={cn("font-mono text-3xl font-semibold tracking-tight tabular-nums", tones[tone])}
      >
        {value}
      </span>
      {detail && <span className="text-muted-foreground text-xs">{detail}</span>}
    </Link>
  );
}
