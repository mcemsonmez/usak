"use client";

import { CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { importStatementAction } from "@/server/actions/payments";
import { FormError } from "./field";

const chips: { key: string; label: string; cls: string }[] = [
  { key: "matched", label: "matched", cls: "bg-good-soft text-good" },
  { key: "overpaid", label: "overpaid", cls: "bg-good-soft text-good" },
  { key: "partial", label: "partial", cls: "bg-warn-soft text-warn-ink" },
  { key: "needs_review", label: "to review", cls: "bg-bad-soft text-bad" },
  { key: "unmatched", label: "outgoing, ignored", cls: "bg-muted text-muted-foreground" },
];

/** Drag a bank CSV in (or pick one); shows what the bank file says and how it matched. */
export function ImportDropzone() {
  const [state, action, pending] = useActionState(importStatementAction, undefined);
  const [file, setFile] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const s = state?.summary;

  // React resets the form (and the file input) after the action; keep the drop area in sync.
  useEffect(() => {
    if (state) setFile(null);
  }, [state]);

  const choose = (f: File | undefined) => {
    if (!f || !input.current) return;
    const dt = new DataTransfer();
    dt.items.add(f);
    input.current.files = dt.files;
    setFile(f);
  };

  return (
    <form action={action} className="grid gap-4">
      <FormError error={state?.error} />
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          choose(e.dataTransfer.files[0]);
        }}
        className={cn(
          "grid cursor-pointer place-items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors duration-(--dur-short)",
          over ? "border-brand bg-brand-soft" : "hover:border-foreground/25 hover:bg-muted/40",
        )}
      >
        <input
          ref={input}
          type="file"
          name="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <FileSpreadsheet className="text-good size-8" aria-hidden />
            <span className="font-medium">{file.name}</span>
            <span className="text-muted-foreground text-xs">
              {(file.size / 1024).toFixed(1)} KB, ready to import
            </span>
          </>
        ) : (
          <>
            <UploadCloud className="text-muted-foreground size-8" aria-hidden />
            <span className="font-medium">Drop your bank&apos;s CSV export here</span>
            <span className="text-muted-foreground text-xs">
              or click to choose a file. Fio, ČSOB, KB, Česká spořitelna and plain CSV.
            </span>
          </>
        )}
      </label>
      <Button type="submit" disabled={pending || !file} className="w-fit">
        {pending ? "Importing and matching…" : "Import and match"}
      </Button>

      {s && (
        <div className="bg-muted/40 grid gap-3 rounded-xl border p-4" role="status">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="text-good size-4" aria-hidden />
            {s.imported} new movement{s.imported === 1 ? "" : "s"} imported
            {s.duplicates > 0 && (
              <span className="text-muted-foreground font-normal">
                , {s.duplicates} already imported before
              </span>
            )}
          </p>
          {(s.statement.account || s.statement.from) && (
            <dl className="text-muted-foreground grid gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
              {s.statement.account && (
                <div>
                  <dt>Account</dt>
                  <dd className="text-foreground font-mono">{s.statement.account}</dd>
                </div>
              )}
              {s.statement.from && (
                <div>
                  <dt>Period</dt>
                  <dd className="text-foreground">
                    {formatDate(s.statement.from)} to {formatDate(s.statement.to)}
                  </dd>
                </div>
              )}
              {s.statement.openingBalance !== null && s.statement.closingBalance !== null && (
                <div>
                  <dt>Balance</dt>
                  <dd className="text-foreground font-mono">
                    {formatMoney(s.statement.openingBalance)} →{" "}
                    {formatMoney(s.statement.closingBalance)}
                  </dd>
                </div>
              )}
            </dl>
          )}
          {Object.keys(s.byStatus).length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {chips
                .filter((c) => s.byStatus[c.key as keyof typeof s.byStatus])
                .map((c) => (
                  <li
                    key={c.key}
                    className={cn("rounded-md px-2 py-0.5 text-xs font-medium", c.cls)}
                  >
                    {s.byStatus[c.key as keyof typeof s.byStatus]} {c.label}
                  </li>
                ))}
            </ul>
          )}
          {s.errors.length > 0 && (
            <ul className="text-bad list-disc pl-5 text-xs">
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
