import { InfoTip } from "@/components/info-tip";
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
      return (
        <InfoTip tip="Signed, starts later. Charges begin from the start date.">
          <Badge tabIndex={0} variant="secondary" className="cursor-help">
            Upcoming
          </Badge>
        </InfoTip>
      );
    case "ending_soon":
      return (
        <InfoTip tip="Ends within 60 days. Time to renew or find the next tenant.">
          <Badge tabIndex={0} variant="warn" className="cursor-help">
            Ends in {daysBetween(today, endDate!)} days
          </Badge>
        </InfoTip>
      );
    case "ended":
      return <Badge variant="secondary">Ended</Badge>;
    default:
      return <Badge variant="outline">Active</Badge>;
  }
}
