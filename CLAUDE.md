# Project: Rental Property Management Platform (usak)

AI-powered rental property management platform, similar to Grento.

**This is a 6-hour project.** Scope and time plan: `README.md`. `PLAN.md` (English version of `usak.pdf`) is the
long-term 14–18 week plan; use it only as reference for data model and logic, not for scope.

Status: no code yet. First step is the skeleton (Next.js, DB, schema, seed data).

## Stack (planned)
Next.js 15 App Router, TypeScript strict, Tailwind + shadcn/ui, Drizzle + PostgreSQL, Zod, Vitest.
No auth, no background job infra, no real email sending (out of scope for 6 hours).

## Available products (for you, not for README)

Use these where they fit the 6-hour scope. Planned: Featherless vision for lease extraction,
PostHog LLM Analytics for AI calls; Apify (rent comparison) or PangeAI (location insights)
as the nice-to-have. Keep product details out of README.

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

## Rules
- Speed over completeness: build the smallest thing that demos well. Ask before adding scope.
- Single demo organization; keep `organizationId` on tables so multi-tenancy can come later.
- Money is stored as integers in minor units (cents/haléř), never floats.
- Dates are stored in UTC and shown in the user's time zone in the UI.
- Server Actions validate input with Zod.
- UI in English only (no i18n for now).
- Tests only where money logic lives (charge generation, payment matching).
- AI output is never saved directly; the user reviews and approves it first.
- Code, comments, commits and docs are in English.

## Commands (once the skeleton exists)
- `pnpm dev` / `pnpm test` / `pnpm db:migrate` / `pnpm db:seed` / `pnpm lint`

## Folder structure (planned)
src/app (pages), src/server (business logic), src/db (schema), src/components

## Workflow
Work on `main` (or short feature branches), commit small and often, push frequently so
the teammate stays in sync. Follow the time plan in README; if a block runs over, cut scope.
