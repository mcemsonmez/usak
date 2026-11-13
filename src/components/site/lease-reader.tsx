"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLoop } from "./use-loop";

const fields = [
  ["Tenant", "Martin Král"],
  ["Unit", "Loft C, Karlín Lofts"],
  ["Term", "1 Dec 2026 to 30 Nov 2027"],
  ["Monthly rent", "16 900 CZK"],
  ["Services", "2 800 CZK"],
  ["Deposit", "33 800 CZK"],
] as const;

/** A signed lease on the left, the fields the AI reads from it filling in on the right. Loops in about 3.6 s. */
export function LeaseReader() {
  const { step, restart } = useLoop(fields.length + 1, 420, 900);
  return (
    <div
      onMouseEnter={restart}
      className="grid gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
    >
      <div className="bg-card relative overflow-hidden rounded-xl border shadow-sm">
        <Image
          src="/samples/sample-lease.png"
          alt="A signed residential lease for Loft C in Karlín Lofts"
          width={1240}
          height={1754}
          className="h-full max-h-[440px] w-full object-cover object-top"
        />
        <div
          aria-hidden
          className="motion-only pointer-events-none absolute inset-x-0 top-0 h-[10%]"
        >
          <div className="via-lime/50 h-full w-full animate-[scan_3.6s_linear_infinite] bg-gradient-to-b from-transparent to-transparent" />
        </div>
      </div>
      <div className="bg-card grid content-start gap-1 rounded-xl border p-4 shadow-sm">
        <p className="mb-2 flex items-center justify-between text-sm font-semibold">
          Read by AI
          <span className="text-muted-foreground text-xs font-normal">check, then save</span>
        </p>
        {fields.map(([label, value], i) => (
          <div
            key={label}
            className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 rounded-md px-2 py-2"
          >
            <span className="text-muted-foreground text-xs">{label}</span>
            <span
              className={cn(
                "truncate rounded-md border px-2.5 py-1.5 text-sm transition-[background-color,border-color,color] duration-300",
                i < step
                  ? "border-good/40 bg-good-soft/60 text-foreground"
                  : "bg-muted text-transparent",
              )}
            >
              {value}
            </span>
          </div>
        ))}
        <span
          className={cn(
            "mt-3 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors duration-300",
            step > fields.length ? "bg-ink text-white" : "bg-muted text-muted-foreground",
          )}
        >
          Approve and save lease
        </span>
      </div>
    </div>
  );
}
