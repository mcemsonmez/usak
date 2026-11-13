# usak

AI-powered rental property management platform (similar to Grento). Full plan: [`usak.pdf`](usak.pdf) (in Turkish).

## Goal

Make rental property management simple for everyone from single-unit landlords to large portfolios.
The MVP answers one question: **"Who owes how much, for which property, and have they paid?"**

MVP scope (Phases 1–4): properties, units and tenants, leases, monthly rent charges,
bank statement (CSV) import with automatic payment matching, debtor list, reminder emails,
a basic dashboard.

After the MVP (Phases 5–8): AI assistant (data extraction from lease PDFs, chat, morning digest),
tenant portal and QR-based maintenance requests, expenses, meters, reports, Stripe subscriptions,
REST API.

## Roadmap

| Phase | Topic | Duration |
|---|---|---|
| 0 | Preparation: target market, currency, languages, repo | ~3 days |
| 1 | Auth + multi-tenancy, data schema, app shell + i18n | 1 week |
| 2 | Property, unit and tenant CRUD + CSV/Excel import | 1 week |
| 3 | Leases, monthly charge engine, lease expiry alerts | 1.5 weeks |
| 4 | Bank import, automatic matching, debt tracking, dashboard: **MVP launch** | 2 weeks |
| 5 | AI assistant | 2 weeks |
| 6 | Tenant portal, maintenance requests, document storage | 1.5 weeks |
| 7 | Expenses, meters, reports | 2 weeks |
| 8 | Commercialization: subscriptions, marketing site, onboarding, API | 2 weeks |

## Planned stack

Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui · PostgreSQL + Drizzle ·
Better Auth · Zod · Inngest · Resend · Claude API · Vitest + Playwright · Vercel

## Available products

The use cases below are suggestions; which product goes into which phase has not been decided yet.

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
- Target market (Turkey or Czechia), currency and languages
- Error tracking: Sentry or PostHog?
- How to split AI work between Claude API and Featherless
- Which phase Apify and PangeAI come in
