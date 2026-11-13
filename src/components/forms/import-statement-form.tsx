"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importStatementAction } from "@/server/actions/payments";
import { FormError } from "./field";

const labels: Record<string, string> = {
  matched: "matched",
  partial: "partial",
  overpaid: "overpaid",
  needs_review: "need review",
  unmatched: "ignored",
};

export function ImportStatementForm() {
  const [state, action, pending] = useActionState(importStatementAction, undefined);
  const s = state?.summary;
  return (
    <form action={action} className="grid gap-3">
      <FormError error={state?.error} />
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="file"
          name="file"
          accept=".csv,text/csv"
          className="max-w-sm"
          aria-label="Bank statement CSV"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Importing…" : "Import"}
        </Button>
      </div>
      {s && (
        <div className="bg-muted/50 rounded-md border px-3 py-2 text-sm" role="status">
          Imported {s.imported} transaction{s.imported === 1 ? "" : "s"}
          {s.duplicates ? `, skipped ${s.duplicates} already imported` : ""}.
          {Object.keys(s.byStatus).length > 0 && (
            <>
              {" "}
              {Object.entries(s.byStatus)
                .map(([k, n]) => `${n} ${labels[k] ?? k}`)
                .join(" · ")}
            </>
          )}
          {s.errors.length > 0 && (
            <ul className="text-destructive mt-1 list-disc pl-5">
              {s.errors.map((e) => (
                <li key={e.line}>
                  Line {e.line}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
