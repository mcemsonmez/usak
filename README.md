# usak

AI-powered rental property management platform (similar to Grento). Full plan: [`usak.pdf`](usak.pdf) (in Turkish).

## Goal

A 6-hour build. Make rental property management simple for landlords.
The demo answers one question: **"Who owes how much, for which property, and have they paid?"**
and shows what the available products (Apify, Featherless, PostHog, PangeAI) add on top.

The full long-term plan (9 phases, 14–18 weeks) is in `usak.pdf`. This repo builds only the
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

**Nice to have (only if time is left)**
- Market rent comparison from listing sites via Apify
- Location enrichment / area insights for properties via PangeAI
- Reminder email drafts written by an LLM

**Out of scope:** auth and multi-tenancy (single demo organization), real email sending,
tenant portal, maintenance requests, expenses, meters, subscriptions, background job infra.

## Time plan

| Time | Block |
|---|---|
| 0:00–0:30 | Skeleton: Next.js, DB, schema, seed data |
| 0:30–2:00 | Properties / units / tenants / leases pages + charge generation |
| 2:00–3:30 | CSV import + matching engine (with tests) + debtor list |
| 3:30–4:30 | AI lease extraction (Featherless vision) + PostHog LLM analytics |
| 4:30–5:15 | Dashboard + one nice-to-have (Apify or PangeAI) |
| 5:15–6:00 | Polish, demo script, deploy, README |

## Planned stack

Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui · PostgreSQL + Drizzle · Zod ·
Vitest · Vercel. AI via Featherless (OpenAI-compatible) and/or Claude API.

## Available products

The use cases below are suggestions; the 6-hour scope above says which ones are planned.

### Apify
- **Apify Store (Actors):** ready-made scrapers/automations, e.g. rent data from listing sites (rent estimation)
- **Actors MCP Server:** expose Actors to the AI assistant as tools
- **Website Content Crawler:** collect rental law, tax and bank documentation for RAG
- **RAG Web Browser:** let the assistant answer with up-to-date web information
- **Browser Use:** pull data from portals that have no API
- **Crawlee:** write our own crawlers in TypeScript

### Featherless
- **Featherless API (OpenAI-compatible):** cheap LLM tasks on open models (summaries, classification)
- **Vision models:** extract data from scanned lease/receipt images, classify maintenance photos

### PostHog
- **AI Observability (LLM Analytics):** cost, latency and error tracking for LLM calls
- **Product Analytics / Web Analytics:** feature usage, onboarding funnel, site traffic
- **Session Replay / Heatmaps:** see where beta users get stuck
- **Feature Flags / Experiments:** gradual rollouts, A/B tests
- **Surveys:** beta user feedback
- **Error Tracking / Logs:** error and server log tracking (alternative to Sentry from the spec)
- **Workflows / Data Warehouse:** event-based automations, joining and querying data
- **PostHog AI / PostHog MCP / Self-driving mode:** natural language and MCP access to analytics data

### PangeAI
- **Geospatial intelligence platform:** enrich property addresses with location data,
  area analysis, location features for rent estimation

## Open decisions
- Demo market and currency (e.g. Czechia / CZK or Turkey / TRY)
- Hosted Postgres (Neon/Supabase) or local Docker for the demo
- Which nice-to-have to build: Apify rent comparison or PangeAI location insights
- Who builds what (2 people)
