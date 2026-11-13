"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { generateChargesAction } from "@/server/actions/charges";

export function GenerateChargesButton({ period, label }: { period: string; label: string }) {
  const [state, action, pending] = useActionState(generateChargesAction, undefined);
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="period" value={period} />
      <Button type="submit" disabled={pending}>
        {pending ? "Generating…" : `Generate charges for ${label}`}
      </Button>
      {state?.message && <p className="text-muted-foreground text-xs">{state.message}</p>}
      {state?.error && <p className="text-destructive text-xs">{state.error}</p>}
    </form>
  );
}
