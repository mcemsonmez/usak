import Link from "next/link";
import { cn } from "@/lib/utils";

const tones = {
  none: "",
  good: "text-good",
  bad: "text-bad",
  warn: "text-[oklch(0.5_0.12_65)]",
} as const;

/** A KPI card: label, big figure, one line of context. Colour only when the figure means something. */
export function StatTile({
  index = 0,
  label,
  value,
  detail,
  href,
  tone = "none",
}: {
  label: string;
  value: React.ReactNode;
  detail?: string;
  href: string;
  tone?: keyof typeof tones;
  index?: number;
}) {
  return (
    <Link
      href={href}
      style={{ ["--i" as string]: index + 2 }}
      className="enter lift group bg-card hover:border-foreground/20 grid gap-3 rounded-xl border p-5 shadow-xs hover:shadow-sm"
    >
      <span className="text-muted-foreground flex items-center justify-between text-sm font-medium">
        {label}
        {tone !== "none" && (
          <span
            aria-hidden
            className={cn(
              "size-2 rounded-full",
              tone === "good" && "bg-good",
              tone === "bad" && "bg-bad",
              tone === "warn" && "bg-warn",
            )}
          />
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
