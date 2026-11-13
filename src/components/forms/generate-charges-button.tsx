"use client";

import { useActionState } from "react";
import { InfoTip } from "@/components/info-tip";
import { Button } from "@/components/ui/button";
import { generateChargesAction } from "@/server/actions/charges";

export function GenerateChargesButton({ period, label }: { period: string; label: string }) {
  const [state, action, pending] = useActionState(generateChargesAction, undefined);
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="period" value={period} />
      <InfoTip tip="Creates rent and service charges for every active lease this month. Partial first or last months are prorated by day. Safe to run twice.">
        <Button type="submit" disabled={pending}>
          {pending ? "Generating…" : `Generate charges for ${label}`}
        </Button>
      </InfoTip>
      {state?.message && <p className="text-muted-foreground text-xs">{state.message}</p>}
      {state?.error && <p className="text-destructive text-xs">{state.error}</p>}
    </form>
  );
}
