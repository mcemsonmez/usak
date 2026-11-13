import { Badge } from "@/components/ui/badge";

const styles: Record<
  string,
  { label: string; className?: string; variant?: "outline" | "secondary" | "destructive" }
> = {
  matched: {
    label: "Matched",
    className: "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200",
  },
  partial: {
    label: "Partial",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  },
  overpaid: {
    label: "Overpaid",
    className: "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200",
  },
  needs_review: { label: "Needs review", variant: "destructive" },
  unmatched: { label: "Ignored", variant: "secondary" },
};

export function MatchStatusBadge({ status }: { status: string }) {
  const s = styles[status] ?? { label: status, variant: "outline" as const };
  return (
    <Badge variant={s.variant} className={s.className}>
      {s.label}
    </Badge>
  );
}
