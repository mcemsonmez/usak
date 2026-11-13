"use client";

import { FileText, Landmark, Wrench } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ActivityItem = {
  id: string;
  kind: "payment" | "repair" | "lease";
  title: string;
  detail: string;
  when: string;
  href: string;
  amount?: string;
};

const icons = { payment: Landmark, repair: Wrench, lease: FileText };
const tones = {
  payment: "bg-good-soft text-good",
  repair: "bg-warn-soft text-warn-ink",
  lease: "bg-lime/15 text-lime",
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const reduce = useReducedMotion();
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Payments, repairs and leases, newest first</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="before:bg-border relative grid gap-1 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-px">
          {items.map((a, i) => {
            const Icon = icons[a.kind];
            return (
              <motion.li
                key={a.id}
                initial={reduce ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.06, type: "spring", stiffness: 300, damping: 28 }}
              >
                <Link
                  href={a.href}
                  className="hover:bg-muted/60 relative flex items-center gap-3 rounded-lg p-1.5 transition-colors duration-(--dur-micro)"
                >
                  <span
                    className={cn(
                      "ring-card relative z-10 grid size-7 shrink-0 place-content-center rounded-full ring-4",
                      tones[a.kind],
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{a.title}</span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {a.detail}, {a.when}
                    </span>
                  </span>
                  {a.amount && (
                    <span className="text-good font-mono text-sm tabular-nums">{a.amount}</span>
                  )}
                </Link>
              </motion.li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
