"use client";

import { FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLoop } from "./use-loop";

type Result = "matched" | "partial" | "overpaid" | "review";

const rows: {
  date: string;
  from: string;
  vs: string;
  amount: string;
  result: Result;
  to: string;
}[] = [
  {
    date: "3 Nov",
    from: "Jana Nováková",
    vs: "2025001",
    amount: "21 700",
    result: "matched",
    to: "Apt 1, rent and services",
  },
  {
    date: "4 Nov",
    from: "Kavárna Anděl s.r.o.",
    vs: "2023006",
    amount: "52 000",
    result: "overpaid",
    to: "Shop, 1 000 CZK credit",
  },
  {
    date: "6 Nov",
    from: "Eva Procházková",
    vs: "none",
    amount: "24 500",
    result: "matched",
    to: "Loft B, known account",
  },
  {
    date: "7 Nov",
    from: "Petr Svoboda",
    vs: "2024002",
    amount: "5 000",
    result: "partial",
    to: "Apt 2, oldest debt first",
  },
  {
    date: "8 Nov",
    from: "Pavel Dvořák",
    vs: "2026030",
    amount: "11 900",
    result: "review",
    to: "Unknown symbol",
  },
];

const badge: Record<Result, { label: string; cls: string }> = {
  matched: { label: "Matched", cls: "bg-good-soft text-good" },
  overpaid: { label: "Overpaid", cls: "bg-good-soft text-good" },
  partial: { label: "Partial", cls: "bg-warn-soft text-warn-ink" },
  review: { label: "Needs review", cls: "bg-bad-soft text-bad" },
};

/** The product's own payments screen, matching a bank statement row by row. Loops in about 3.8 s. */
export function HeroMatcher() {
  const { step, restart } = useLoop(rows.length, 520, 1200);
  const done = rows.slice(0, step);
  const count = (r: Result[]) => done.filter((x) => r.includes(x.result)).length;

  return (
    <div
      onMouseEnter={restart}
      className="bg-card text-card-foreground overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/40"
      aria-label="usak matching a bank statement to leases"
      role="img"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5">
        <div>
          <p className="text-sm font-semibold">Payments, November 2026</p>
          <p className="text-muted-foreground text-xs">
            Matched by variable symbol and payer account
          </p>
        </div>
        <span className="bg-muted flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium">
          <FileSpreadsheet className="text-good size-4" aria-hidden />
          bank-statement-2026-11.csv
        </span>
      </div>
      <ul className="divide-y">
        {rows.map((r, i) => {
          const shown = i < step;
          return (
            <li
              key={r.vs + r.from}
              className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 sm:grid-cols-[3.5rem_minmax(0,1fr)_6.5rem_7.5rem]"
            >
              <span className="text-muted-foreground text-xs">{r.date}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{r.from}</span>
                <span
                  className={cn(
                    "text-muted-foreground block truncate text-xs transition-opacity duration-300",
                    shown ? "opacity-100" : "opacity-0",
                  )}
                >
                  {r.to}
                </span>
              </span>
              <span className="hidden text-right font-mono text-sm tabular-nums sm:block">
                {r.amount} CZK
              </span>
              <span className="flex justify-end">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium transition-[background-color,color,transform] duration-300 ease-(--ease-out)",
                    shown
                      ? cn(badge[r.result].cls, "scale-100")
                      : "bg-muted text-muted-foreground scale-95",
                  )}
                >
                  {shown ? badge[r.result].label : "Matching…"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="bg-muted/50 text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 border-t px-5 py-3 font-mono text-xs tabular-nums">
        <span>
          <span className="text-good font-semibold">{count(["matched", "overpaid"])}</span> matched
        </span>
        <span>
          <span className="text-warn-ink font-semibold">{count(["partial"])}</span> partial
        </span>
        <span>
          <span className="text-bad font-semibold">{count(["review"])}</span> to review
        </span>
      </div>
    </div>
  );
}
