import { Badge } from "@/components/ui/badge";
import type { ReminderLevel } from "@/server/billing/debtors";

export function ReminderBadge({ level, onDark }: { level: ReminderLevel; onDark?: boolean }) {
  switch (level) {
    case "final":
      return onDark ? (
        <Badge className="text-ink bg-white">Final notice</Badge>
      ) : (
        <Badge variant="ink">Final notice</Badge>
      );
    case "serious":
      return <Badge variant="bad">Serious</Badge>;
    case "polite":
      return <Badge variant="warn">Polite reminder</Badge>;
    default:
      return <Badge variant="outline">Grace period</Badge>;
  }
}
