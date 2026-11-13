import { Badge } from "@/components/ui/badge";
import { daysBetween } from "@/lib/dates";
import type { LeasePhase } from "@/lib/leases";

export function LeaseBadge({
  phase,
  endDate,
  today,
}: {
  phase: LeasePhase;
  endDate: string | null;
  today: string;
}) {
  switch (phase) {
    case "upcoming":
      return <Badge variant="outline">Upcoming</Badge>;
    case "ending_soon":
      return (
        <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
          Ends in {daysBetween(today, endDate!)} days
        </Badge>
      );
    case "ended":
      return <Badge variant="secondary">Ended</Badge>;
    default:
      return (
        <Badge className="bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200">
          Active
        </Badge>
      );
  }
}
