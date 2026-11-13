import { InfoTip } from "@/components/info-tip";
import { Badge } from "@/components/ui/badge";

export function ChargeStatusBadge({ status, overdue }: { status: string; overdue?: boolean }) {
  const [label, variant, tip] =
    status === "paid"
      ? (["Paid", "good", "Fully covered by matched bank payments."] as const)
      : status === "partially_paid"
        ? (["Partially paid", "warn", "Some of it is paid; the rest is still owed."] as const)
        : overdue
          ? (["Overdue", "bad", "Not paid and past its due date."] as const)
          : (["Open", "outline", "Not paid yet, not due yet."] as const);
  return (
    <InfoTip tip={tip}>
      <Badge tabIndex={0} variant={variant} className="cursor-help">
        {label}
      </Badge>
    </InfoTip>
  );
}
