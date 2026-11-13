"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Steps 0..steps, then holds and restarts. One full cycle = steps * stepMs + holdMs (keep it 2.5-4 s).
 * Under reduced motion it rests on the final step.
 */
export function useLoop(steps: number, stepMs: number, holdMs: number) {
  const [step, setStep] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setStill(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (still) return;
    const holdTicks = Math.ceil(holdMs / stepMs);
    const id = window.setInterval(() => {
      setStep((s) => (s >= steps + holdTicks ? 0 : s + 1));
    }, stepMs);
    return () => window.clearInterval(id);
  }, [still, steps, stepMs, holdMs]);

  const restart = useCallback(() => setStep(0), []);
  return { step: still ? steps : Math.min(step, steps), restart };
}
