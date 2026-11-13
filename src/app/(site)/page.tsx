import {
  ArrowRight,
  Bot,
  Building2,
  HandCoins,
  Landmark,
  MapPin,
  Star,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FlowDiagram } from "@/components/site/flow-diagram";
import { HeroMatcher } from "@/components/site/hero-matcher";
import { LeaseReader } from "@/components/site/lease-reader";
import { WordHighlight } from "@/components/site/word-highlight";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "usak: rent collection for Prague landlords",
  description:
    "Import your bank statement and usak matches every payment to its lease, shows who owes what, reads new leases with AI and finds repairers nearby.",
};

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${dark ? "text-white" : "text-ink"}`}>
      <span className="bg-lime text-ink grid size-8 place-content-center rounded-lg text-base font-bold">
        u
      </span>
      <span className="text-lg font-semibold tracking-tight">usak</span>
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-background">
      <a
        href="#main"
        className="bg-lime text-ink sr-only z-50 rounded-md px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* Hero */}
      <header className="bg-ink relative isolate overflow-hidden text-white">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.06)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)] [background-size:56px_56px] opacity-[0.35]"
        />
        <div
          aria-hidden
          className="bg-lime/25 absolute top-[-10rem] right-[-6rem] -z-10 size-[36rem] rounded-full blur-[120px]"
        />
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5"
        >
          <Logo dark />
          <div className="text-sidebar-muted hidden items-center gap-7 text-sm md:flex">
            <a href="#matching" className="transition-colors hover:text-white">
              Matching
            </a>
            <a href="#ai" className="transition-colors hover:text-white">
              AI leases
            </a>
            <a href="#market" className="transition-colors hover:text-white">
              Market and repairs
            </a>
          </div>
          <Button asChild variant="lime" size="sm" className="h-9 px-4">
            <Link href="/dashboard">Open the demo</Link>
          </Button>
        </nav>

        <div className="mx-auto grid min-h-[calc(100dvh-76px)] max-w-7xl items-center gap-12 px-6 pt-6 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="grid gap-7">
            <p
              className="enter text-sidebar-muted flex items-center gap-2 text-sm"
              style={{ ["--i" as string]: 0 }}
            >
              <span
                className="text-lime live-dot relative inline-flex size-2 rounded-full bg-current"
                aria-hidden
              />
              For landlords in Prague, from one flat to a whole building
            </p>
            <h1
              className="enter text-5xl leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl xl:text-7xl"
              style={{ ["--i" as string]: 1 }}
            >
              Rent collection that <span className="text-lime">chases itself.</span>
            </h1>
            <p
              className="enter text-sidebar-muted max-w-xl text-lg leading-relaxed"
              style={{ ["--i" as string]: 2 }}
            >
              Drop in your bank&apos;s CSV. usak matches each payment to its lease by variable
              symbol and tells you who still owes, how much and for how long.
            </p>
            <div className="enter flex flex-wrap gap-3" style={{ ["--i" as string]: 3 }}>
              <Button asChild variant="lime" className="h-11 px-5 text-base">
                <Link href="/dashboard">
                  Open the demo <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 border-white/20 bg-transparent px-5 text-base text-white hover:bg-white/10"
              >
                <a href="#matching">See how matching works</a>
              </Button>
            </div>
          </div>
          <div className="enter" style={{ ["--i" as string]: 3 }}>
            <HeroMatcher />
          </div>
        </div>
      </header>

      <main id="main">
        {/* Matching */}
        <section
          id="matching"
          aria-labelledby="matching-h"
          className="mx-auto grid min-h-dvh max-w-7xl content-center gap-12 px-6 py-24"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <h2 id="matching-h" className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              From bank statement to paid rent, in one import.
            </h2>
            <p className="text-muted-foreground max-w-xl text-lg">
              Exact payments clear themselves. Short ones pay the oldest debt first. Anything
              unclear waits for you with the likely lease next to it.
            </p>
          </div>
          <div className="bg-card rounded-2xl border p-6 shadow-sm sm:p-10">
            <FlowDiagram />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Landmark,
                title: "Any Czech bank",
                text: "Semicolons, Czech headers, 18 500,00. Import twice and nothing doubles.",
              },
              {
                icon: HandCoins,
                title: "Debtors with a next step",
                text: "Days late and a ready reminder: polite at 3 days, final notice at 20.",
              },
              {
                icon: Building2,
                title: "Prorated from day one",
                text: "Moved in on the 10th? The first month bills 21 of 30 days.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="lift bg-card rounded-xl border p-5 shadow-xs hover:shadow-md"
              >
                <Icon className="text-ink size-5" aria-hidden />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AI leases */}
        <section id="ai" aria-labelledby="ai-h" className="bg-card border-y">
          <div className="mx-auto grid min-h-dvh max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="grid gap-5">
              <span className="bg-ink text-lime grid size-11 place-content-center rounded-xl">
                <Bot className="size-5" aria-hidden />
              </span>
              <h2 id="ai-h" className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                New leases type themselves in.
              </h2>
              <p className="text-muted-foreground text-lg">
                Photograph the signed lease. A vision model fills in the tenant, unit, dates and
                amounts, and finds the unit you already have. Nothing is saved until you approve it.
              </p>
              <Button asChild className="w-fit">
                <Link href="/leases/import">
                  Try it with the sample lease <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
            <LeaseReader />
          </div>
        </section>

        {/* Market rent + repairers */}
        <section
          id="market"
          aria-labelledby="market-h"
          className="mx-auto grid min-h-dvh max-w-7xl content-center gap-12 px-6 py-24"
        >
          <h2
            id="market-h"
            className="max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl"
          >
            Know when the rent is low. Find a plumber by lunch.
          </h2>
          <div className="grid gap-5 lg:grid-cols-2">
            <Link
              href="/properties"
              className="lift group bg-card grid gap-6 rounded-2xl border p-6 shadow-xs hover:shadow-md sm:p-8"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">Apt 1, Vinohrady, 2+kk</p>
                <span className="text-muted-foreground text-xs">live listings, Praha 2</span>
              </div>
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current rent</span>
                    <span className="font-mono font-semibold tabular-nums">18 500 CZK</span>
                  </div>
                  <div className="bg-track h-3 overflow-hidden rounded-full">
                    <div className="bg-ink h-full w-[56%] rounded-full" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Market median, 43 listing prices</span>
                    <span className="font-mono font-semibold tabular-nums">23 490 CZK</span>
                  </div>
                  <div className="bg-track h-3 overflow-hidden rounded-full">
                    <div className="bg-lime-strong h-full w-[71%] rounded-full" />
                  </div>
                </div>
              </div>
              <p className="bg-warn-soft rounded-lg px-4 py-3 text-sm font-medium text-[oklch(0.42_0.1_65)]">
                21% below market. Room for an increase at renewal.
              </p>
              <span className="flex items-center gap-1 text-sm font-medium">
                Compare a unit{" "}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>

            <Link
              href="/maintenance"
              className="lift group bg-card grid gap-5 rounded-2xl border p-6 shadow-xs hover:shadow-md sm:p-8"
            >
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-semibold">
                  <Wrench className="size-4" aria-hidden /> Kitchen sink leaking, Apt 2
                </p>
                <span className="bg-bad-soft text-bad rounded-md px-2 py-0.5 text-xs font-medium">
                  New
                </span>
              </div>
              <ul className="divide-y rounded-xl border">
                {[
                  ["Plumber", "Vinohrady"],
                  ["Water and heating", "Praha 2"],
                  ["Drain cleaning", "Nové Město"],
                ].map(([trade, area]) => (
                  <li key={trade} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{trade}</span>
                      <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        <MapPin className="size-3" aria-hidden /> {area}
                        <Star
                          className="ml-2 size-3 fill-current text-[oklch(0.75_0.15_80)]"
                          aria-hidden
                        />{" "}
                        rated on Google Maps
                      </span>
                    </span>
                    <span className="bg-ink rounded-md px-2.5 py-1 text-xs font-medium text-white">
                      Contact
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-sm">
                Rated repairers near the property, searched in Czech and English, with a message
                ready to send.
              </p>
              <span className="flex items-center gap-1 text-sm font-medium">
                Open maintenance{" "}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          </div>
        </section>

        <WordHighlight text="Who owes how much, for which property, and have they paid? *One *screen *answers *it *every *morning." />

        {/* Close */}
        <section aria-labelledby="close-h" className="bg-lime text-ink">
          <div className="mx-auto grid min-h-[70dvh] max-w-7xl content-center gap-8 px-6 py-24">
            <h2
              id="close-h"
              className="max-w-4xl text-5xl leading-[1.02] font-semibold tracking-[-0.04em] sm:text-7xl"
            >
              See this month&apos;s rent in one screen.
            </h2>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-12 px-6 text-base">
                <Link href="/dashboard">
                  Open the demo <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-ink/20 h-12 bg-transparent px-6 text-base hover:bg-white/30"
              >
                <Link href="/payments">Import a bank statement</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-sidebar-muted">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm">
          <Logo dark />
          <p>Built in Prague for landlords in Czechia. Demo data only.</p>
        </div>
      </footer>
    </div>
  );
}
