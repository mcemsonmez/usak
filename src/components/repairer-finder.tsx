"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { contactRepairerAction, findRepairersAction } from "@/server/actions/maintenance";
import type { ContactResult } from "@/server/maintenance/contact-repairer";
import type { Repairer } from "@/server/maintenance/find-repairers";

export function RepairerFinder({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(findRepairersAction, undefined);
  const [messages, setMessages] = useState<Record<string, ContactResult | { error: string }>>({});
  const [contacting, startContact] = useTransition();

  const contact = (r: Repairer) =>
    startContact(async () => {
      const result = await contactRepairerAction(requestId, r, r.phone ? "sms" : "email");
      setMessages((m) => ({ ...m, [r.name]: result }));
    });

  return (
    <div className="grid gap-3">
      <form action={action}>
        <input type="hidden" name="requestId" value={requestId} />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending
            ? "Searching Google Maps (~30 s)…"
            : state?.repairers
              ? "Search again"
              : "Find repairers"}
        </Button>
      </form>
      {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state?.repairers && (
        <div className="grid gap-2">
          <p className="text-muted-foreground text-xs">
            {state.repairers.length} found near {state.location} · via Apify Google Maps scraper
          </p>
          {state.repairers.length === 0 && <p className="text-sm">No repairers found.</p>}
          <ul className="grid gap-2">
            {state.repairers.map((r) => {
              const msg = messages[r.name];
              return (
                <li key={r.name} className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {r.mapsUrl ? (
                          <a
                            href={r.mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                          >
                            {r.name}
                          </a>
                        ) : (
                          r.name
                        )}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {[r.category, r.address].filter(Boolean).join(" · ")}
                      </div>
                      <div className="text-xs">
                        {r.rating
                          ? `★ ${r.rating.toFixed(1)} (${r.reviewsCount ?? 0} review${r.reviewsCount === 1 ? "" : "s"})`
                          : "No rating"}
                        {r.phone && ` · ${r.phone}`}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => contact(r)} disabled={contacting}>
                      Contact
                    </Button>
                  </div>
                  {msg && (
                    <p className="bg-muted/50 mt-2 rounded px-2 py-1.5 text-xs">
                      {"error" in msg ? msg.error : msg.message}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
