# usak

**Rent collection that chases itself.** usak is AI-powered rental property management for
landlords in Prague, from one flat to a whole building. Every morning it answers one question:
**who owes how much, for which property, and have they paid?**

Drop in your bank's CSV export and every payment is matched to the lease it pays, even when the
tenant forgot the reference or paid too little. Photograph a signed lease and AI fills it in for
you. Click a unit to see how its rent compares with live listings nearby, or find a rated plumber
around the corner in seconds.

Built in 6 hours at a hackathon with [Featherless](https://featherless.ai), [Apify](https://apify.com)
and [PostHog](https://posthog.com).

| | |
|---|---|
| **Matching** | Bank CSV (Fio, ČSOB, KB, Česká spořitelna) matched to leases by variable symbol or the payer's usual account; partial payments, credit and a review queue |
| **AI** | A vision model reads lease photos; nothing is saved until you approve |
| **Live data** | Market rent from current listings, repairers from Google Maps |
| **At a glance** | Who owes what, collections over time, occupancy, leases ending soon |

## Team

- [@mcemsonmez](https://github.com/mcemsonmez)
- [Yasin Sezgin (@gweilnid)](https://github.com/gweilnid)

Long-term plan (9 phases, 14–18 weeks): [`PLAN.md`](PLAN.md).

## Features

- **Records:** properties, units, tenants and leases. Overlapping leases on a unit are blocked;
  each lease gets a unique variable symbol (payment reference).
- **Monthly charges:** rent and service charges per lease, prorated for partial months.
  Safe to run twice for the same month.
- **Bank statement import:** CSV from any bank (Czech formats included). Payments are matched
  automatically: by variable symbol, or by a known account paying the usual amount.
  Oldest debt is paid first; partial and overpayments are tracked; anything unclear goes to a
  review list and can be matched by hand. Importing the same file twice is safe.
- **Debtors:** overdue amount, days late and reminder level (polite at 3 days, serious at 10,
  final notice at 20) with a ready-to-send reminder draft.
- **Dashboard:** collected vs. billed, overdue total, occupancy, payments to review,
  maintenance, collections by month, leases ending soon.
- **AI lease import:** upload a photo or scan of a signed lease; a vision model fills in the
  tenant, unit, dates and amounts. Nothing is saved until you check and approve it.
- **Market rent:** compare a unit's rent with live listing prices in its district.
- **Maintenance:** log issues, move them across a status board, find rated repairers nearby
  and draft a message to them.
- **Analytics:** pageviews and every AI call are tracked.

Not included (yet): login and multiple organizations, sending real emails/SMS, tenant portal,
expenses, meters, subscriptions.

## Sponsor products

| Product | What we use | Where in the app |
|---|---|---|
| **Featherless** | Vision model Qwen3-VL-30B-A3B-Instruct (OpenAI-compatible API) | **AI lease import**: reads a photo of a signed lease and fills tenant, unit, dates and amounts; saved only after approval |
| **Apify** | Google Maps Scraper (`compass/crawler-google-places`) | **Maintenance → Find repairers**: rated repairers near the property, with a drafted message |
| **Apify** | RAG Web Browser (`apify/rag-web-browser`) | **Property → Market rent**: live listings in the district, median vs current rent |
| **PostHog** | LLM Analytics (`$ai_generation` per AI call) | Every AI lease import: model, tokens, latency, errors |
| **PostHog** | Product and Web Analytics (posthog-js) | Pageviews and autocapture across the site and app |

Details and code paths: [`presentation/SPONSORS.md`](presentation/SPONSORS.md).

## Getting started

Requirements: Node.js 20+, pnpm 9, Docker.

```bash
pnpm install
cp .env.example .env   # fill in the API keys
pnpm db:up             # Postgres in Docker
pnpm db:reset          # create tables + demo data
pnpm dev               # http://localhost:3000 (landing), /dashboard (app)
```

For a live demo use `pnpm demo` (production build: faster, and no dev overlay).

Reset the demo at any time with `pnpm db:seed`. Step-by-step start, stop and troubleshooting: [`presentation/START.md`](presentation/START.md).

| Command | What it does |
|---|---|
| `pnpm dev` | Start the app (development) |
| `pnpm demo` | Production build and start, for presenting |
| `pnpm test` | Unit tests (charges, matching, CSV parsing, debtors, AI parsing, ranking) |
| `pnpm lint` / `pnpm typecheck` / `pnpm format` | Code quality |
| `pnpm db:up` / `pnpm db:down` | Start / stop Postgres |
| `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:studio` | Database schema |
| `pnpm db:seed` / `pnpm db:reset` | Reload demo data / migrate + reload |

## Demo script (about 5 minutes)

Demo data: a Prague landlord with 3 properties, 7 units, 6 tenants, two months of payment
history. Petr still owes part of last month's rent.

0. **Landing page** (`/`) – the live matching animation in the hero, the flow diagram, the AI
   lease loop. Click *Open the demo*.
1. **Dashboard** (`/dashboard`) – try ⌘K to jump anywhere and ⌘B to collapse the sidebar. collections for the last two months, Petr overdue with a final notice,
   two leases ending in under 60 days.
2. **Charges** – click *Generate charges* for this month: 12 charges, Lucie's first month is
   prorated (she moved in on the 10th). Click again: nothing is duplicated.
3. **Payments** – download the sample statement on the page and import it:
   - Jana and Tomáš: matched by variable symbol
   - Eva: no variable symbol, matched by her known account and usual amount
   - Kavárna: overpaid, shown as credit
   - Petr: partial, goes to last month's debt first
   - Pavel Dvořák (wrong variable symbol): lands in *Needs review*; match it to Lucie by hand
   - Bank fee: ignored

   Import the same file again: everything is skipped.
4. **Debtors** – Petr is still overdue; open *Draft reminder* to see the final notice.
5. **Leases → Import with AI** – download the sample lease, upload it, click *Read with AI*.
   The form fills in Martin Král, Loft C, dates and amounts; approve to save the lease and the
   new tenant.
6. **Properties → Vinohrady Residence** – click *Market rent* on Apt 1: Jana's rent compared
   with live listings in Praha 2 (takes 30–60 s).
7. **Maintenance** – *Find repairers* on the leaking sink in Apt 2: plumbers nearby with
   ratings and phone numbers; *Contact* shows the message that would be sent (about 30 s).

## Project structure

```
src/app/(site)    landing page
src/app/(app)     the app: dashboard and record pages (server components, filtered by organization)
src/server        business logic
  billing/        charge calculation, debtors, reminders
  bank/           CSV parsing, payment matching, import, sample statements
  ai/             lease extraction and AI call analytics
  apify/          market rent from listings
  maintenance/    repairer search and contact drafts
  actions/        Server Actions (Zod-validated)
src/db            schema, client, seed
src/components    UI and forms
```

Money is stored as integers in haléř (100 = 1 CZK). Pure logic (charges, matching, parsing,
debtors) is separate from the database and covered by unit tests.
