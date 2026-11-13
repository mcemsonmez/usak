import { Badge } from "@/components/ui/badge";

const styles: Record<
  string,
  { label: string; variant: "good" | "warn" | "bad" | "secondary" | "outline" }
> = {
  matched: { label: "Matched", variant: "good" },
  overpaid: { label: "Overpaid", variant: "good" },
  partial: { label: "Partial", variant: "warn" },
  needs_review: { label: "Needs review", variant: "bad" },
  unmatched: { label: "Ignored", variant: "secondary" },
};

export function MatchStatusBadge({ status }: { status: string }) {
  const s = styles[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
