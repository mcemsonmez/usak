# usak: features for the presentation

Files in this folder:
- `bank-statement-2026-11.csv`: Fio-format bank export to import on **Payments** (also downloadable in the app: "Sample statement").
- `sample-lease.png`: signed lease to upload on **AI lease import**.

Reset the demo before presenting: `pnpm db:seed`, then `pnpm demo` (production mode).

## Website (`/`)
- Dark hero with a live animation of bank payments being matched
- Flow diagram (bank CSV → matching → matched / partial / needs review)
- AI lease-reading loop, market rent and repairer cards, scroll-lit statement, lime call to action

## App shell
- Collapsible sidebar (⌘B) with live count badges (debtors, payments to review, new repairs)
- Quick create menu, ⌘K command palette (pages + actions), breadcrumb
- Dark and light themes (toggle in the header), page transitions
- Add forms open as modals (property, tenant, lease, unit, maintenance issue)

## Dashboard
- "Who owes?" board: debtors, amounts, days late, reminder level
- Smart tools section (AI / Auto / Live data badges, explanations on hover)
- KPI cards: collected this month, overdue, payments to review, new repairs
- Expected vs collected chart (3 months / 30 days), occupancy ring per property
- Activity timeline, leases ending soon

## Records
- Properties, units, tenants, leases; overlap check; automatic variable symbol
- Lease phases: upcoming, active, ending soon (60 days), ended

## Money
- **Charges:** monthly rent + service charges, prorated partial months, safe to run twice
- **Payments (Auto):** drag-and-drop CSV import (Fio, ČSOB, KB, Česká spořitelna, plain CSV);
  reads account, period and balances; matching by variable symbol, then known account + usual amount;
  oldest debt first; partial / overpaid (credit) / needs review / ignored; duplicate-safe re-import;
  status tabs; manual match inline; recent imports
- **Debtors:** overdue amount, days late, reminder level (3 / 10 / 20 days), reminder draft (not sent)

## AI and live data
- **AI lease import:** vision model (Featherless, Qwen3-VL) reads a lease photo, fills tenant, unit,
  dates, rent, deposit; matches the existing unit; saved only after approval; calls logged to PostHog
- **Market rent (Live data):** live listings in the unit's district (Apify), median and middle half vs current rent
- **Find a repairer (Live data):** Google Maps search near the property (Apify), ranked by category and
  rating; contact drafts a message (not sent)

## Behind the scenes
- PostHog: product analytics, pageviews, LLM analytics for AI calls
- 49 unit tests (charges, matching, CSV parsing, debtors, AI parsing, ranking)

## Suggested demo order
1. Website hero → Open the demo
2. Dashboard: Who owes, Smart tools (hover), chart
3. Charges → Generate charges for this month
4. Payments → import `bank-statement-2026-11.csv`, review tab, match Pavel Dvořák to Lucie
5. Debtors → Draft reminder
6. AI lease import → `sample-lease.png` → approve
7. Property → Market rent; Maintenance → Find repairers (each takes 30–60 s)
8. ⌘K, ⌘B, theme toggle
