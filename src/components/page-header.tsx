import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  action,
  secondaryAction,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  action?: { href: string; label: string };
  secondaryAction?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-1">
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      <div className="flex gap-2">
        {actions}
        {secondaryAction && (
          <Button asChild variant="outline">
            <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
          </Button>
        )}
        {action && (
          <Button asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
