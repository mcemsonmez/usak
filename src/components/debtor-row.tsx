"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { ReminderDraft } from "@/server/billing/reminders";

/** A debtor row plus a full-width row below it with the reminder draft. */
export function DebtorRow({
  cells,
  draft,
  colSpan,
}: {
  cells: React.ReactNode;
  draft: ReminderDraft;
  colSpan: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Fragment>
      <TableRow>
        {cells}
        <TableCell className="text-right">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            {open ? "Hide reminder" : "Draft reminder"}
          </Button>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={colSpan} className="bg-muted/30 whitespace-normal">
            <div className="max-w-2xl py-2">
              <p className="font-medium">{draft.subject}</p>
              <pre className="mt-2 font-sans text-sm whitespace-pre-wrap">{draft.body}</pre>
              <p className="text-muted-foreground mt-2 text-xs">{draft.note}</p>
            </div>
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}
