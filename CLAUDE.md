# Project: Rental Property Management Platform (usak)

AI-powered rental property management platform, similar to Grento.

**This is a 6-hour project.** Scope and time plan: `README.md`. `PLAN.md` is the
long-term 14–18 week plan; use it only as reference for data model and logic, not for scope.

Status: all 9 steps done. Demo script in README. Reset demo data with `pnpm db:seed`. Demo currency: CZK (Prague demo data).

## Steps
1. Skeleton: Next.js 15, Tailwind, shadcn/ui, Postgres in Docker, Drizzle (done)
2. Schema + seed data (done; schema in `src/db/schema.ts`, seed in `src/db/seed.ts`)
3. Record pages: properties, units, tenants, leases (done)
4. Monthly rent charges (done; `src/server/billing/charges.ts` is pure + tested, `generate.ts` writes to DB)
5. Bank CSV import + matching (done; Fio export format with account header and bank-code column; `src/server/bank/`: csv.ts + matching.ts are pure + tested, import.ts writes to DB, sample.ts has demo statements)
6. Debtor list + dashboard (done; `debtors.ts` pure + tested, reminders return a draft only)
7. AI lease extraction (done; `src/server/ai/`: Featherless vision via fetch, `$ai_generation` events to PostHog, parsing pure + tested; /leases/import)
8. Apify (done): market rent via RAG Web Browser (`src/server/apify/market-rent.ts`, on property pages);
   repairers via Google Maps scraper on /maintenance (Czech + English search, ranked by category)

Find repairers (`src/server/maintenance/`): `findRepairers` uses the Apify Google Maps scraper;
`contactRepairer` only returns the message that would be sent (email/SMS not implemented).
Use district-level locations ("Praha 2, Czechia"); exact addresses return too few results.
Dev routes: `/api/repairers`, `/api/market-rent`.
9. Polish (done): client-side PostHog (pageviews, replay), README with demo script, build verified.
   Not deployed: needs a hosted Postgres.

## Stack (planned)
Next.js 15 App Router, TypeScript strict, Tailwind + shadcn/ui, Drizzle + PostgreSQL (local Docker), Zod, Vitest.
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

## Project skills (`.claude/skills/`)
UI/motion skills installed with `npx skills add` (versions pinned in `skills-lock.json`;
restore with `npx skills experimental_install`):
- Emil Kowalski (`emilkowalski/skills`): `emil-design-eng`, `animate`, `choreograph`,
  `improve-animations`, `review-animations`, `find-animation-opportunities`, `break-ui`, ...
  Native-only ones (`write-swift`, `animate-expo`, `mobile-native`, `apple-design`) do not apply here.
- Taste Skill (`Leonxlnx/taste-skill`): `design-taste-frontend`.
- Hallmark (`nutlope/hallmark`): `hallmark` (its Floor rules are followed; full runs only when named).

## Routes
`/` is the marketing landing page (`src/app/(site)`, components in `src/components/site`).
The app lives in `src/app/(app)` with the sidebar layout; the dashboard is `/dashboard`.

## Design system
Dark app by default with a light theme toggle (cookie `theme=light` adds `.theme-light` on <html>),
light landing, one lime accent. `--brand` is lime on dark and deep olive on light: use `text-brand`
for text/icons, `bg-lime` only for filled buttons with ink text. Tokens in `src/app/globals.css`:
`:root` holds the dark values, `.theme-light` (on the landing page root) the light ones. In custom
CSS/SVG use the raw vars (`var(--good)`, `var(--border)`), not `--color-*` (those resolve at :root).
- App shell (`src/app/(app)/layout.tsx`): shadcn Sidebar (inset, collapses to icons with ⌘B) with
  grouped nav and live count badges, Quick create menu, header with breadcrumb, ⌘K command menu
  (`src/components/app`). `template.tsx` animates every page in.
- Dashboard: "Who owes?" board, KPI cards with trend chips, expected-vs-collected area chart
  (Recharts via shadcn chart), occupancy radial, activity timeline; sections stagger in (Motion).
- Add forms open as modals: intercepting routes in `src/app/(app)/@modal/(.)…/new` (direct URLs still
  render full pages); inline adds (unit, maintenance issue) use `FormDialog`.
- Geist for text, Geist Mono for money (`font-mono tabular-nums`).
- Status colours, one meaning each: `good` (paid, money in), `bad` (overdue, review), `warn`
  (partial, ending soon). Lime is brand only (active nav, Quick create, chart "collected").
- Motion respects reduced motion everywhere; no transition-all.

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

## Commands
- `pnpm db:up` / `pnpm db:down`: start/stop Postgres in Docker
- `pnpm dev` / `pnpm lint` / `pnpm typecheck`
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:studio`
- `pnpm db:seed`: wipe and reload demo data / `pnpm db:reset`: migrate + seed
- `pnpm test`: Vitest unit tests

## Folder structure
- src/app: pages (server components query the DB directly, always filtered by `getOrgId()`)
- src/server/actions: Server Actions (Zod validation, return `FormState` with `values` on error)
- src/server: business logic; src/server/org.ts gives the demo organization id
- src/lib: shared helpers (money, dates, lease phase, form state)
- src/components/forms: client forms using `useActionState`
- src/db: schema, client, seed

## Workflow
Work on `main` (or short feature branches), commit small and often, push frequently so
the teammate stays in sync. Follow the time plan in README; if a block runs over, cut scope.
