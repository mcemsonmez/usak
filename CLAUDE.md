# Project: Rental Property Management Platform (usak)

AI-powered rental property management platform, similar to Grento. Full plan and per-phase
prompts: `usak.pdf` (in Turkish). Project description, roadmap and available products: `README.md`.

Status: no code yet. First step is Phase 0 / Prompt 0.1 (project skeleton).

## Stack (planned)
Next.js 15 App Router, TypeScript strict, Tailwind + shadcn/ui,
Drizzle + PostgreSQL, Better Auth, Zod, Inngest, Resend, Vitest, Playwright.

Available external products (details in README): Apify (Actors, Actors MCP Server,
Website Content Crawler, RAG Web Browser, Browser Use, Crawlee), Featherless (OpenAI-compatible
API, vision models), PostHog (LLM Analytics, Product/Web Analytics, Session Replay,
Heatmaps, Feature Flags, Experiments, Surveys, Error Tracking, Logs, Workflows, Data
Warehouse, PostHog AI, MCP), PangeAI (geospatial intelligence).

## Rules
- Every table has `organizationId`; every query filters by it (multi-tenant).
- Money is stored as integers in minor units (cents/haléř), never floats.
- Dates are stored in UTC and shown in the user's time zone in the UI.
- Server Actions validate input with Zod.
- UI strings come from i18n files (tr, en, cs).
- New feature = ships with tests.
- AI output is never written directly; suggestion + user approval + audit log.
- No out-of-scope features before Phase 4 (MVP).
- Code, comments, commits and docs are in English.

## Commands (once the skeleton exists)
- `pnpm dev` / `pnpm test` / `pnpm e2e` / `pnpm db:migrate` / `pnpm lint`

## Folder structure (planned)
src/app (pages), src/server (business logic), src/db (schema), src/components

## Workflow
One branch per phase, one commit per step (prompt). Plan first, then code, then test,
then commit.
