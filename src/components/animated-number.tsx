"use client";

import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";

/** Counts up from 0 on mount. kind: money (minor units, CZK), percent (0-100) or count. */
export function AnimatedNumber({
  value,
  kind = "count",
}: {
  value: number;
  kind?: "money" | "percent" | "count";
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  if (kind === "money")
    return (
      <NumberFlow
        value={shown / 100}
        locales="en-CZ"
        format={{ style: "currency", currency: "CZK", maximumFractionDigits: 0 }}
      />
    );
  if (kind === "percent") return <NumberFlow value={shown} suffix="%" />;
  return <NumberFlow value={shown} />;
}
