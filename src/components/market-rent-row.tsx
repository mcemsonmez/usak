"use client";

import { Fragment, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { marketRentAction } from "@/server/actions/market";

/** A unit row with a "Market rent" button; the result opens in a full-width row below. */
export function MarketRentRow({
  cells,
  unitId,
  currentRent,
  colSpan,
}: {
  cells: React.ReactNode;
  unitId: string;
  currentRent: number | null;
  colSpan: number;
}) {
  const [state, action, pending] = useActionState(marketRentAction, undefined);
  const r = state?.result;
  const diff = r?.median && currentRent ? (currentRent - r.median) / r.median : null;

  return (
    <Fragment>
      <TableRow>
        {cells}
        <TableCell className="text-right">
          <form action={action}>
            <input type="hidden" name="unitId" value={unitId} />
            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              {pending ? "Searching listings (~30–60 s)…" : "Market rent"}
            </Button>
          </form>
        </TableCell>
      </TableRow>
      {(state?.error || r) && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={colSpan} className="bg-muted/30 whitespace-normal">
            {state?.error ? (
              <p className="text-destructive text-sm">{state.error}</p>
            ) : r && r.median ? (
              <div className="grid gap-1 py-1 text-sm">
                <p>
                  <span className="font-medium">Market rent: {formatMoney(r.median)}</span>{" "}
                  <span className="text-muted-foreground">
                    (middle half {formatMoney(r.low!)} – {formatMoney(r.high!)}, {r.sampleSize}{" "}
                    listing prices)
                  </span>
                </p>
                {diff !== null && (
                  <p>
                    Current rent {formatMoney(currentRent!)} is{" "}
                    <span className="font-medium">
                      {Math.abs(Math.round(diff * 100))}% {diff < 0 ? "below" : "above"} market
                    </span>
                    {diff < -0.1 ? " — room for a rent increase at renewal." : "."}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Search: “{r.query}” · Sources:{" "}
                  {r.sources.map((s, i) => (
                    <Fragment key={s.url}>
                      {i > 0 && ", "}
                      <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                        {new URL(s.url).hostname.replace(/^www\./, "")}
                      </a>
                    </Fragment>
                  ))}
                  . Via Apify RAG Web Browser.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Not enough listing prices found for “{r?.query}”. Try again later.
              </p>
            )}
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}
