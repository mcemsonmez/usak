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
      return <Badge variant="secondary">Upcoming</Badge>;
    case "ending_soon":
      return <Badge variant="warn">Ends in {daysBetween(today, endDate!)} days</Badge>;
    case "ended":
      return <Badge variant="secondary">Ended</Badge>;
    default:
      return <Badge variant="outline">Active</Badge>;
  }
}
