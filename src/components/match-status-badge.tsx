import { InfoTip } from "@/components/info-tip";
import { Badge } from "@/components/ui/badge";

const styles: Record<
  string,
  { label: string; variant: "good" | "warn" | "bad" | "secondary" | "outline"; tip: string }
> = {
  matched: {
    label: "Matched",
    variant: "good",
    tip: "Paid exactly what was owed. Found by variable symbol or the payer's usual account.",
  },
  overpaid: {
    label: "Overpaid",
    variant: "good",
    tip: "Paid more than was owed. The extra is kept as credit on the lease.",
  },
  partial: {
    label: "Partial",
    variant: "warn",
    tip: "Paid less than was owed. It cleared the oldest debt first; the rest is still open.",
  },
  needs_review: {
    label: "Needs review",
    variant: "bad",
    tip: "No lease could be found for this payment. Pick the lease and it is matched like any other.",
  },
  unmatched: {
    label: "Ignored",
    variant: "secondary",
    tip: "Outgoing payment or bank fee. Not rent, so it is not matched.",
  },
};

export function MatchStatusBadge({ status }: { status: string }) {
  const s = styles[status] ?? { label: status, variant: "outline" as const, tip: status };
  return (
    <InfoTip tip={s.tip}>
      <Badge tabIndex={0} variant={s.variant} className="cursor-help">
        {s.label}
      </Badge>
    </InfoTip>
  );
}
