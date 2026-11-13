import { InfoTip } from "@/components/info-tip";
import { Badge } from "@/components/ui/badge";
import type { ReminderLevel } from "@/server/billing/debtors";

const LEVELS: Record<
  ReminderLevel,
  { label: string; variant: "ink" | "bad" | "warn" | "outline"; tip: string }
> = {
  final: {
    label: "Final notice",
    variant: "ink",
    tip: "More than 20 days late. The draft reminder is a final notice.",
  },
  serious: {
    label: "Serious",
    variant: "bad",
    tip: "10 to 19 days late. The draft reminder asks firmly for payment.",
  },
  polite: {
    label: "Polite reminder",
    variant: "warn",
    tip: "3 to 9 days late. The draft reminder is friendly.",
  },
  none: {
    label: "Grace period",
    variant: "outline",
    tip: "Less than 3 days late. No reminder yet.",
  },
};

export function ReminderBadge({ level }: { level: ReminderLevel }) {
  const l = LEVELS[level];
  return (
    <InfoTip tip={l.tip}>
      <Badge tabIndex={0} variant={l.variant} className="cursor-help">
        {l.label}
      </Badge>
    </InfoTip>
  );
}
