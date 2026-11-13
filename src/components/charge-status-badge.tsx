import { Badge } from "@/components/ui/badge";

export function ChargeStatusBadge({ status, overdue }: { status: string; overdue?: boolean }) {
  if (status === "paid")
    return (
      <Badge className="bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200">
        Paid
      </Badge>
    );
  if (status === "partially_paid")
    return (
      <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
        Partially paid
      </Badge>
    );
  return overdue ? (
    <Badge variant="destructive">Overdue</Badge>
  ) : (
    <Badge variant="outline">Open</Badge>
  );
}
