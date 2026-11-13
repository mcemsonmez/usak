import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Wraps any element with a short explanation shown on hover and keyboard focus. */
export function InfoTip({
  tip,
  children,
  side = "top",
}: {
  tip: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="max-w-72 text-xs leading-relaxed text-balance">
        {tip}
      </TooltipContent>
    </Tooltip>
  );
}

/** A small (i) icon with an explanation, for labels. */
export function InfoDot({ tip, className }: { tip: React.ReactNode; className?: string }) {
  return (
    <InfoTip tip={tip}>
      <span
        tabIndex={0}
        role="img"
        aria-label="More info"
        className={cn(
          "text-muted-foreground hover:text-foreground inline-flex cursor-help",
          className,
        )}
      >
        <Info className="size-3.5" aria-hidden />
      </span>
    </InfoTip>
  );
}
