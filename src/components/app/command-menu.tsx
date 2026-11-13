"use client";

import { ArrowRight, Download, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { NAV_GROUPS, QUICK_ACTIONS } from "./nav-items";

/** ⌘K / Ctrl+K: jump to any page or start an action. */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    if (href.startsWith("/api/")) window.location.href = href;
    else router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted flex h-9 w-full max-w-72 items-center gap-2 rounded-lg border px-3 text-sm transition-colors duration-(--dur-micro)"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-left">Search or jump to…</span>
        <kbd className="bg-background text-muted-foreground hidden rounded border px-1.5 font-mono text-[11px] sm:inline">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search usak">
        <Command
          filter={(value, search) =>
            value.toLowerCase().includes(search.toLowerCase().trim()) ? 1 : 0
          }
        >
          <CommandInput placeholder="Type a page or an action…" />
          <CommandList>
            <CommandEmpty>Nothing found.</CommandEmpty>
            <CommandGroup heading="Actions">
              {QUICK_ACTIONS.map((a) => (
                <CommandItem key={a.label} onSelect={() => go(a.href)}>
                  {a.label.includes("AI") ? <Sparkles className="text-brand" /> : <ArrowRight />}
                  {a.label}
                </CommandItem>
              ))}
              <CommandItem onSelect={() => go("/charges")}>
                <ArrowRight />
                Generate this month&apos;s charges
              </CommandItem>
              <CommandItem onSelect={() => go("/api/sample-statement")}>
                <Download />
                Download the sample bank statement
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            {NAV_GROUPS.map((g) => (
              <CommandGroup key={g.label} heading={g.label}>
                {g.items.map((i) => (
                  <CommandItem key={i.href} onSelect={() => go(i.href)}>
                    <i.icon />
                    {i.label}
                    <CommandShortcut>{i.href}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
