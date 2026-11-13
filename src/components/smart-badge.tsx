import { Globe, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoTip } from "./info-tip";

export type SmartKind = "ai" | "auto" | "live";

const KINDS: Record<SmartKind, { label: string; icon: typeof Sparkles; cls: string; tip: string }> =
  {
    ai: {
      label: "AI",
      icon: Sparkles,
      cls: "bg-brand-soft text-brand ring-brand/30",
      tip: "Uses an AI model. You always check the result before anything is saved.",
    },
    auto: {
      label: "Auto",
      icon: Zap,
      cls: "bg-good-soft text-good ring-good/30",
      tip: "Runs on its own with clear rules. Anything unclear is left for you.",
    },
    live: {
      label: "Live data",
      icon: Globe,
      cls: "bg-warn-soft text-warn-ink ring-warn/30",
      tip: "Looks up fresh data on the web when you click. Takes up to a minute.",
    },
  };

/** Marks a smart feature: AI (a model), Auto (rules) or Live data (web lookup). */
export function SmartBadge({
  kind,
  tip,
  className,
}: {
  kind: SmartKind;
  tip?: string;
  className?: string;
}) {
  const k = KINDS[kind];
  return (
    <InfoTip tip={tip ?? k.tip}>
      <span
        tabIndex={0}
        className={cn(
          "inline-flex cursor-help items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
          k.cls,
          className,
        )}
      >
        <k.icon className="size-3" aria-hidden />
        {k.label}
      </span>
    </InfoTip>
  );
}
