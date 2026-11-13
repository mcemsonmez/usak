# usak: Long-term plan

Written Nov 13, 2026. This is the full 14–18 week plan. The 6-hour
build scope is in `README.md`; use this document as reference for the data model and logic.

## Summary

Goal: build an AI-assisted rental property management platform similar to Grento in 8 phases,
splitting each phase into small, testable steps to give to Claude Code. The first working
product (MVP) ships at the end of Phase 4: properties, tenants, leases, rent charges, bank
statement matching and reminder emails.

Grento is a property management SaaS focused on the Czech market. It targets everyone from
single-apartment landlords to portfolios of 1,000+ properties. Its main features:

- **Records:** properties/units, tenant cards, leases, lease amendments, document storage
- **Finance:** automatic invoicing/charges, bank connection (Fio API, CSV/ABO import) and
  payment matching by variable symbol, debt tracking, QR payment codes
- **AI assistant:** natural language commands, data extraction from lease PDFs, morning
  digest, cash flow forecast, rent estimation
- **Operations:** maintenance requests (QR, no login), meter readings, service charge /
  expense allocation, calendar, task board
- **Integrations:** accounting exports (POHODA, Money S3), Google Calendar, email/SMS, REST API

This plan does not copy all of it, only the core that creates value; the rest is left for
later phases. Assumption: one developer + Claude Code, 10–15 hours a week. Decide the target
market (Turkey or Czechia) in Phase 0; the plan fits both.

## Scope

The MVP solves one question only: **"Who owes how much, for which property, and have they
paid?"** Everything else comes after the MVP.

| Feature | MVP (Phases 1–4) | Later (Phases 5–8) |
|---|---|---|
| Sign-up, login, multi-tenant account | Yes | Role-based team management |
| Property / unit / tenant CRUD | Yes | Linking land registry data |
| Lease + monthly rent charges | Yes | Amendment templates, e-signature |
| Bank statement import (CSV) + automatic matching | Yes | Open Banking API (Fio, GoCardless, etc.) |
| Debtor list + email reminders | Yes | SMS, escalation chain, QR payment |
| Dashboard (collections, arrears, occupancy) | Basic | Budget vs. actual, cash flow forecast |
| AI assistant | No | Data extraction from lease PDFs, chat, morning digest |
| Tenant portal + QR maintenance requests | No | Yes |
| Meters, service charge / expense allocation | No | Yes |
| Accounting export, REST API, payments (Stripe) | No | Yes |

Out of scope for this plan: IoT meters, ESG reporting, mortgage comparison, vehicle logbook,
double-entry accounting. These are part of Grento's breadth; early on they only split focus.

## Tech stack

One TypeScript monorepo, one database, one deploy: the setup Claude Code works best with and
that one person can run.

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Frontend + backend in one project; Server Actions remove the need for a separate API |
| UI | Tailwind CSS + shadcn/ui | Ready, accessible components that Claude Code knows well |
| Database | PostgreSQL (Neon or Supabase, EU region) | Relational data, EU servers for GDPR |
| ORM | Drizzle ORM (alternative: Prisma) | Type-safe schema, migrations |
| Auth | Better Auth or Auth.js | Email/password + Google; organization (multi-tenant) support |
| Validation | Zod | One schema for forms and API |
| Background jobs | Inngest or Trigger.dev | Monthly charges, reminder emails, scheduled jobs |
| Email | Resend + React Email | Simple API, templates in code |
| File storage | S3-compatible (Cloudflare R2 / Supabase Storage) | Lease PDFs, photos |
| AI | Claude API (Anthropic SDK) | Data extraction from PDFs, assistant with tool use |
| Testing | Vitest + Playwright | Unit + end-to-end tests |
| Deploy | Vercel (or Docker + Hetzner) | Deploy on push, preview environments |
| Monitoring | Sentry | Error tracking |

Alternative: FastAPI + React also works if you prefer Python, but a single language (TS)
means less friction with Claude Code.

## Working with Claude Code

The underlying rule: one small feature per session. Plan first, then code, then test, then commit.

### Setup (once)

1. Install Node.js 20+, Git, Docker (for local Postgres).
2. Install Claude Code and start it in the project folder with `claude`.
3. Open an empty GitHub repo; one branch per phase, one commit per step.
4. Run `/init` in the first session and edit the generated `CLAUDE.md` as below.

### CLAUDE.md template

```md
# Project: Rental Property Management Platform (Grento-like)
## Stack
Next.js 15 App Router, TypeScript strict, Tailwind + shadcn/ui,
Drizzle + PostgreSQL, Better Auth, Zod, Inngest, Resend, Vitest, Playwright.
## Rules
- Every table has `organizationId`; every query filters by it (multi-tenant).
- Money is stored as integers (cents/haléř), never floats.
- Dates are stored in UTC and shown in the user's time zone in the UI.
- Server Actions validate with Zod.
- UI strings come from i18n files (tr, en, cs).
- New feature = with tests.
## Commands
- `pnpm dev` / `pnpm test` / `pnpm e2e` / `pnpm db:migrate` / `pnpm lint`
## Folder structure
src/app (pages), src/server (business logic), src/db (schema), src/components
```

### Loop for every step

1. **Plan mode** (Shift+Tab): give the step's prompt, ask Claude for a plan first, read and fix it.
2. **Implement:** once approved, Claude writes the code. For big changes, say "go file by file".
3. **Verify:** run `pnpm test` and `pnpm lint`; open the app in the browser and try it yourself.
4. **Commit:** say "commit the changes with a descriptive message".
5. **Clean up:** when the step is done, reset context with `/clear` so the next step starts clean.

### Useful habits

- Keep a short spec per phase in `docs/`; add "read @docs/phase-2.md" to the prompt.
- Write custom slash commands for repeated work under `.claude/commands/` (e.g. `/new-crud`).
- Add a Postgres MCP server so Claude can see the schema directly.
- If something breaks: paste the error message as is and say "find the cause first, then fix it".

## Data model

The MVP runs on 10 tables, all carrying `organizationId`. In Phase 1 you can give this table
to Claude Code to write the Drizzle schema.

| Table | Main fields | Relation |
|---|---|---|
| organization | name, country, currency, locale | Top-level container (account) |
| user / member | email, name, role (owner, manager, viewer) | Belongs to organization |
| property | name, address, type (apartment, house, commercial), ownerId | Belongs to organization |
| unit | propertyId, label, areaM2, rooms, status | Unit of a property |
| tenant | fullName, email, phone, idNumber, notes | Belongs to organization |
| lease | unitId, tenantId, startDate, endDate, rentAmount, depositAmount, dueDay, variableSymbol, status | unit + tenant |
| charge | leaseId, period (YYYY-MM), type (rent, service charge, deposit), amount, dueDate, status | Charge of a lease |
| bank_transaction | date, amount, counterAccount, variableSymbol, message, importBatchId, matchStatus | From the statement |
| payment_allocation | bankTransactionId, chargeId, amount | Transaction ↔ charge match (supports partial payments) |
| reminder_log | chargeId, channel, sentAt, level | Reminder history |

Added after the MVP: document, maintenance_request, meter + meter_reading, expense, vendor,
ai_suggestion (records suggested by AI awaiting approval), audit_log.

## Phases and steps

9 phases (0–8), about 14–18 weeks in total; the MVP goes live at the end of Phase 4, around
week 7. Prompts can be copied into Claude Code as is; each one is a single session of work.

### Phase 0: Preparation (~3 days)

- Pick the target market, currency and languages (e.g. CZK + cs/en/tr).
- Review 3–4 competitor screens, write your own MVP screen list.
- Open the repo, set up the project skeleton.

**Prompt 0.1:** Set up a new project with Next.js 15 (App Router, TypeScript strict, pnpm).
Add Tailwind and shadcn/ui. Connect Drizzle ORM + PostgreSQL; create a docker-compose.yml for
local Postgres. Install ESLint, Prettier, Vitest and Playwright. Add dev, test, e2e, lint,
db:generate, db:migrate scripts to package.json. Write .env.example. Show the plan first.

### Phase 1: Foundation: auth and multi-tenancy (1 week)

**Prompt 1.1:** Add email/password sign-up and login with Better Auth. On sign-up, create an
organization for the user automatically and make them owner. Have a protected /app area and
public /login, /register pages.

**Prompt 1.2:** Write the tables in @docs/data-model.md as a Drizzle schema. Money fields are
integers (minor units); every table has organizationId, createdAt, updatedAt. Generate and run
the migration. Also write and test a helper (getOrgDb or similar) that forces every query to
filter by organizationId.

**Prompt 1.3:** Build the app shell with shadcn/ui: left menu (Dashboard, Properties, Tenants,
Leases, Payments, Settings), top bar, mobile friendly. Add tr/en/cs language support with next-intl.

**Exit criterion:** two different users sign up and cannot see each other's data (proven by an e2e test).

### Phase 2: Property, unit and tenant records (1 week)

**Prompt 2.1:** Build full CRUD for properties: list (search, filter, pagination),
create/edit form (react-hook-form + Zod), detail page. The detail page has a units sub-list
and unit creation. Use Server Actions, write unit tests.

**Prompt 2.2:** Build Tenants CRUD with the same pattern. The tenant card will later have
lease, payment and document tabs; add empty tabs for now.

**Prompt 2.3:** Add bulk property and tenant import from Excel/CSV: file upload, column
mapping screen, preview, show invalid rows, confirm and save.

Tip: when 2.1 is done, tell Claude "save this CRUD pattern as .claude/commands/new-crud.md";
you can repeat it with one command in later modules.

### Phase 3: Leases and rent charges (1.5 weeks)

**Prompt 3.1:** Lease CRUD: pick unit + tenant, start/end, monthly rent, deposit, due day,
automatically generated unique variableSymbol. Do not allow two overlapping active leases on
the same unit for the same dates (write a test).

**Prompt 3.2:** Write the monthly charge engine: create a rent charge on the 1st of every
month for each active lease. Make it idempotent (running it twice for the same month must not
create duplicates). Schedule it as an Inngest cron job. Calculate pro-rata rent for leases
starting mid-month. Write unit tests for edge cases.

**Prompt 3.3:** Generate an alert 60/30 days before a lease ends and show it on the
dashboard. Allow recording rent increases (percentage or fixed amount, with effective date).

### Phase 4: Payment matching, debt tracking, MVP launch (2 weeks)

**Prompt 4.1:** Write bank statement CSV import. Define a parser interface for different bank
formats; start with a generic CSV + column mapping screen. Prevent importing the same
transaction twice (with a hash).

**Prompt 4.2:** Write the automatic matching engine. Order: 1) exact variableSymbol + amount
match, 2) variableSymbol + different amount (partial/overpayment), 3) counter account + amount
history. Exact matches are applied automatically; partial payments reduce the debt,
overpayments are flagged separately; uncertain ones go to a "Needs review" list and can be
matched by hand. Write a test for every scenario.

**Prompt 4.3:** Debtor list page (tenant, amount, days overdue) and reminder emails with React
Email + Resend: due date +3 days polite, +10 days serious, +20 days final notice. Every send is
written to reminder_log; the same level is never sent twice.

**Prompt 4.4:** Dashboard: expected vs. collected this month, total debt, occupancy rate,
ending leases, transactions to review. Simple charts with Recharts.

Deploy to Vercel + Neon (EU), add Sentry, give it to 3–5 landlords you know as a beta.

### Phase 5: AI assistant (2 weeks)

**Prompt 5.1:** Build data extraction from lease PDFs with the Claude API. Upload a PDF, ask
the model for structured JSON (tenant name, unit address, dates, rent, deposit), validate with
Zod. The result is not saved directly; it is written to the ai_suggestion table and the user
previews, edits and approves or rejects it.

**Prompt 5.2:** Build an in-app chat assistant. Using Claude tool use, it has these tools:
list_debtors, property_summary, find_lease, draft_reminder. Read tools run directly; write
actions always show a confirmation card. All tools are scoped by organizationId.

**Prompt 5.3:** A digest email to the user every morning at 07:00: late payments, ending
leases, open maintenance requests. Generate short, readable text with Claude.

### Phase 6: Tenant portal and maintenance requests (1.5 weeks)

**Prompt 6.1:** A separate portal for tenants with magic-link login: debt status, payment
history, lease document, payment details.

**Prompt 6.2:** Generate a printable QR code for every unit; the QR opens a maintenance
request form without login (description + photo). Requests appear on a Kanban board for the
manager (New, In progress, Done). Add rate limiting against spam.

**Prompt 6.3:** Document storage: file upload linked to property/tenant/lease (R2), preview,
signed and expiring download links.

### Phase 7: Expenses, meters, reports (2 weeks)

**Prompt 7.1:** Expense records (vendor, category, amount, property) and expense allocation:
distribute to units by area, number of people or share ratio. Year-end service charge
reconciliation: advances - actual costs = refund or extra charge.

**Prompt 7.2:** Meters and meter readings (main + sub-meters), calculate consumption
differences, flag abnormal increases.

**Prompt 7.3:** Reports: income/expense per property, annual rental income (for tax returns),
CSV/PDF/XLSX export. A generic CSV format for export to accounting software.

### Phase 8: Commercialization (2 weeks)

**Prompt 8.1:** Subscriptions with Stripe: plans by number of properties, 14-day trial
without credit card, plan limits enforced in the app, customer portal.

**Prompt 8.2:** Marketing site: landing page, features, pricing, FAQ, legal pages
(KVKK/GDPR, terms). SEO meta tags and sitemap.

**Prompt 8.3:** Onboarding wizard (first property, first tenant, first lease), team invites
and roles, REST API with API keys (with OpenAPI documentation).

## Testing, security and deploy

For a product that handles money and personal data, this list must be done before the MVP launch.

- Unit test coverage of 90%+ on the charge and matching engines
- Playwright tests for critical flows: sign-up, creating property-tenant-lease, statement
  import, matching
- Multi-tenant isolation test: organization A cannot access any record of B (including by
  changing IDs in the URL)
- GitHub Actions: lint + test + build on every PR
- Database and files in the EU region; automatic daily backups and restore drills
- Personal data: fields like ID numbers encrypted; data export and account deletion (GDPR/KVKK)
- Rate limiting (login, QR form, AI endpoints), security headers, secrets only in environment variables
- AI output is never written directly; approval flow + audit_log
- Sentry + basic uptime monitoring

Claude Code tip: at the end of every phase, open a separate review session: "review this
phase's code for security, especially organizationId filters and authorization checks".
Use the built-in `/security-review` command too if available.

## Risks and recommendations

The biggest risk is not technical but scope: trying to copy Grento's 40+ features will never
finish the project.

| Risk | Impact | Mitigation |
|---|---|---|
| Scope creep | MVP never ships | No new features before Phase 4; write ideas to docs/backlog.md |
| Local rules (tax, rental law, bank formats) | Wrong calculations, loss of trust | Start with one country; have a lawyer check lease templates |
| Errors in money calculations | Wrong debts, customer complaints | Integer amounts, thorough tests, every change in audit_log |
| Claude Code making large, scattered changes | Unreadable code | Plan mode, small steps, read the diff and commit after each step |
| Bank API access (licensing, PSD2) | Automatic sync is delayed | CSV import in the MVP; later use an aggregator like GoCardless/Finbricks |
| AI cost and wrong output | Cost, wrong records | Suggestion + approval model, per-request limits, start with a cheap model |

Final advice: at the end of Phase 4, talk to 3–5 real landlords. Reorder Phases 5–8 based on
the feature they want most.

Source: grento.ai (reviewed on Nov 13, 2026).
