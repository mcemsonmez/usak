import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  detail,
  href,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
  tone?: "warning" | "critical";
}) {
  const body = (
    <>
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        {tone && (
          <span
            aria-hidden
            className={cn(
              "size-2 rounded-full",
              tone === "critical" ? "bg-red-600" : "bg-amber-500",
            )}
          />
        )}
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {detail && <div className="text-muted-foreground mt-0.5 text-xs">{detail}</div>}
    </>
  );
  const className = "rounded-lg border p-4";
  return href ? (
    <Link href={href} className={cn(className, "hover:bg-muted/40 transition-colors")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
