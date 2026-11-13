# Project: Rental Property Management Platform (usak)

AI-powered rental property management platform, similar to Grento.

**This is a 6-hour project.** Scope and time plan: `README.md`. `usak.pdf` (in Turkish) is the
long-term 14–18 week plan; use it only as reference for data model and logic, not for scope.

Status: no code yet. First step is the skeleton (Next.js, DB, schema, seed data).

## Stack (planned)
Next.js 15 App Router, TypeScript strict, Tailwind + shadcn/ui, Drizzle + PostgreSQL, Zod, Vitest.
No auth, no background job infra, no real email sending (out of scope for 6 hours).

Available external products (details in README): Apify (Actors, Actors MCP Server,
Website Content Crawler, RAG Web Browser, Browser Use, Crawlee), Featherless (OpenAI-compatible
API, vision models), PostHog (LLM Analytics, Product/Web Analytics, Session Replay,
Heatmaps, Feature Flags, Experiments, Surveys, Error Tracking, Logs, Workflows, Data
Warehouse, PostHog AI, MCP), PangeAI (geospatial intelligence).

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
