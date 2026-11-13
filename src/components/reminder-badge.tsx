import { Badge } from "@/components/ui/badge";
import type { ReminderLevel } from "@/server/billing/debtors";

export function ReminderBadge({ level }: { level: ReminderLevel }) {
  switch (level) {
    case "final":
      return <Badge variant="destructive">Final notice</Badge>;
    case "serious":
      return (
        <Badge className="bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200">
          Serious
        </Badge>
      );
    case "polite":
      return (
        <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
          Polite reminder
        </Badge>
      );
    default:
      return <Badge variant="outline">Grace period</Badge>;
  }
}
