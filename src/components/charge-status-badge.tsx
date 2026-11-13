import { Badge } from "@/components/ui/badge";

export function ChargeStatusBadge({ status, overdue }: { status: string; overdue?: boolean }) {
  if (status === "paid") return <Badge variant="good">Paid</Badge>;
  if (status === "partially_paid") return <Badge variant="warn">Partially paid</Badge>;
  return overdue ? <Badge variant="bad">Overdue</Badge> : <Badge variant="outline">Open</Badge>;
}
