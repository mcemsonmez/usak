# usak

AI-powered rental property management platform (similar to Grento). Full plan: [`PLAN.md`](PLAN.md).

## Goal

A 6-hour build. Make rental property management simple for landlords.
The demo answers one question: **"Who owes how much, for which property, and have they paid?"**

The full long-term plan (9 phases, 14–18 weeks) is in `PLAN.md`. This repo builds only the
demo-able core in 6 hours; everything else is out of scope.

## Scope (6 hours)

**Must have**
- Properties, units, tenants and leases (seeded demo data + simple create forms)
- Monthly rent charges generated from leases
- Bank statement CSV import with automatic matching (variable symbol + amount),
  partial payments, an "needs review" list
- Debtor list and a dashboard (expected vs. collected, total debt, occupancy)
- One AI feature: upload a lease (PDF/image), extract fields with a vision model,
  user reviews and approves before saving

- Find repairers near a property for a maintenance request (contacting them returns a
  draft message for now; no real email/SMS)

**Nice to have (only if time is left)**
- Market rent comparison from listing sites
- Location enrichment / area insights for properties
- Reminder email drafts written by an LLM

**Out of scope:** auth and multi-tenancy (single demo organization), real email sending,
tenant portal, maintenance requests, expenses, meters, subscriptions, background job infra.

## Time plan

| Time | Block |
|---|---|
| 0:00–0:30 | Skeleton: Next.js, DB, schema, seed data |
| 0:30–2:00 | Properties / units / tenants / leases pages + charge generation |
| 2:00–3:30 | CSV import + matching engine (with tests) + debtor list |
| 3:30–4:30 | AI lease extraction + LLM analytics |
| 4:30–5:15 | Dashboard + one nice-to-have |
| 5:15–6:00 | Polish, demo script, deploy, README |

## Planned stack

Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui · PostgreSQL + Drizzle · Zod ·
Vitest · Vercel.

## Getting started

Requirements: Node.js 20+, pnpm 9, Docker.

```bash
pnpm install
cp .env.example .env   # then fill in the keys
pnpm db:up             # Postgres in Docker
pnpm dev               # http://localhost:3000
```

## Open decisions
- Demo market and currency (e.g. Czechia / CZK or Turkey / TRY)
- Which nice-to-have to build: rent comparison or location insights
- Who builds what (2 people)
