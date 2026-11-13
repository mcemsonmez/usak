"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { matchManuallyAction } from "@/server/actions/payments";

export function ManualMatchForm({
  transactionId,
  leases,
}: {
  transactionId: string;
  leases: { value: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(matchManuallyAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="transactionId" value={transactionId} />
      <select
        name="leaseId"
        aria-label="Lease"
        defaultValue=""
        className="border-input bg-card h-8 max-w-64 rounded-lg border px-2 text-sm shadow-xs"
      >
        <option value="">Match to lease…</option>
        {leases.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Matching…" : "Match"}
      </Button>
      {state?.error && <span className="text-destructive text-xs">{state.error}</span>}
    </form>
  );
}
