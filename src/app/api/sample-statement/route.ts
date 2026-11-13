import { periodOf } from "@/server/billing/charges";
import { currentStatementCsv } from "@/server/bank/sample";

export function GET() {
  const period = periodOf(new Date().toISOString().slice(0, 10));
  return new Response(currentStatementCsv(period), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bank-statement-${period}.csv"`,
    },
  });
}
