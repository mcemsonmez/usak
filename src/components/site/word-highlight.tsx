"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** The dealt moment: a statement whose words light up as its own section scrolls past. */
export function WordHighlight({ text }: { text: string }) {
  const ref = useRef<HTMLElement>(null);
  const words = text.split(" ");
  const [lit, setLit] = useState(words.length);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(travel, 1)));
      setLit(Math.round(p * words.length * 1.15));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [words.length]);

  return (
    <section
      ref={ref}
      aria-label="What usak answers"
      className="bg-ink relative h-[200vh] text-white motion-reduce:h-auto"
    >
      <div className="sticky top-0 flex min-h-dvh items-center motion-reduce:static">
        <p className="mx-auto max-w-5xl px-6 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-6xl">
          {words.map((w, i) => (
            <span
              key={i}
              className={cn(
                "transition-colors duration-300",
                i < lit ? "text-white" : "text-white/15",
                w.startsWith("*") && i < lit && "text-lime",
              )}
            >
              {w.replace("*", "")}{" "}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
