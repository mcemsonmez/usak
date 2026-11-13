# usak: step-by-step test plan

Run this before the presentation. Each step lists what to do and what you should see.
Files used are in this folder. Desktop browser, about 15 minutes.

## 0. Prepare

| # | Do | Expect |
|---|---|---|
| 0.1 | `pnpm db:up` | Postgres container running |
| 0.2 | `pnpm db:seed` | "Seeded: 1 organization, 3 properties, 7 units, 6 tenants, 6 leases, 2 maintenance requests" |
| 0.3 | `pnpm demo` and open http://localhost:3000 | Landing page loads, no error badge |

## 1. Website

| # | Do | Expect |
|---|---|---|
| 1.1 | Watch the hero for 5 seconds | Payment rows turn Matched / Overpaid / Partial / Needs review one by one, counters at the bottom count up, loop restarts |
| 1.2 | Scroll down | Flow diagram with pulses, AI lease loop filling fields, market rent and repairer cards, a statement whose words light up, lime closing band |
| 1.3 | Click **Open the demo** | Dashboard opens |

## 2. Dashboard

| # | Do | Expect |
|---|---|---|
| 2.1 | Look at "Who owes?" | Petr Svoboda, 8 100 CZK, 29 days late, Final notice |
| 2.2 | Hover each Smart tools card | A short explanation appears; badges read AI, Auto, Live data, Live data |
| 2.3 | Hover the (i) next to "Overdue" | "Unpaid charges past their due date, across all months." |
| 2.4 | Chart: click **30 days**, hover the line | Range changes, tooltip shows Expected and Collected for the day |
| 2.5 | Occupancy | 86% centred in the ring, bars per property (3/3, 2/3, 1/1) |
| 2.6 | Sidebar badges | Debtors 1 (red), Maintenance 1 (amber), AI on "AI lease import" |

## 3. App shell

| # | Do | Expect |
|---|---|---|
| 3.1 | Press **⌘K**, type `debtors`, press Enter | Debtors page opens |
| 3.2 | Press **⌘B** | Sidebar collapses to icons; press again to expand |
| 3.3 | Click the sun/moon in the header, reload | Theme switches and stays after reload |
| 3.4 | Quick create → New tenant | Form opens as a modal over the page; Escape closes it |

## 4. Records

| # | Do | Expect |
|---|---|---|
| 4.1 | Properties → **New property**, click Create with empty fields | "Required" under name, address, city |
| 4.2 | Fill Žižkov Corner, Seifertova 812/41, Praha 3 → Create | Property page opens; "No units yet" message |
| 4.3 | **Add unit**: Flat 1, 2+kk, 52 | Modal closes, Flat 1 listed as Vacant |
| 4.4 | Flat 1 → **New lease** | Modal opens with Flat 1 already selected |
| 4.5 | Change unit to Karlín Lofts, Loft A; tenant Eva; start 1 Dec; rent 19 800 → Create | Error "This unit already has an active lease…", fields keep their values |
| 4.6 | Change unit back to Flat 1 → Create | Leases page, new lease "Upcoming", variable symbol 2026006 |
| 4.7 | Tenants → New tenant, any name → Create | Modal closes, tenant appears with initials avatar |

## 5. Charges

| # | Do | Expect |
|---|---|---|
| 5.1 | Charges → **Generate charges for November 2026** | 12 charges, 171 900 CZK; Lucie's rent prorated to 10 150 CZK |
| 5.2 | Click Generate again | "No new charges … already existed" |

## 6. Payments (Auto)

| # | Do | Expect |
|---|---|---|
| 6.1 | Payments → drag **bank-statement-2026-11.csv** onto the drop area → Import and match | Account 2001987654/2010, period 1 to 12 Nov, balance 598 731,40 → 745 962,40; chips: 3 matched, 1 overpaid, 1 partial, 1 to review, 2 outgoing ignored |
| 6.2 | Import the same file again | "0 new movements imported, 8 already imported before" |
| 6.3 | Import **bank-statement-with-errors.csv** | Line 8: Invalid date "31.11.2026"; Line 9: Invalid amount; the 99 CZK fee imported as Ignored |
| 6.4 | Tab **Needs review** | Pavel Dvořák, 11 900 CZK, VS 2026030 |
| 6.5 | Match it to Lucie Dvořáková → Match | Row disappears from Needs review; Lucie is now paid |
| 6.6 | Hover status badges (Matched, Partial, Overpaid) | Short explanation for each |

## 7. Debtors

| # | Do | Expect |
|---|---|---|
| 7.1 | Debtors | Petr Svoboda 3 100 CZK (October), Final notice |
| 7.2 | **Draft reminder** | Final notice text with amount and variable symbol, "Not sent" note |

## 8. AI lease import (uses the Featherless API key)

| # | Do | Expect |
|---|---|---|
| 8.1 | AI lease import → choose **sample-lease.png** → Read with AI | In 5 to 20 s: Martin Král, email, phone, Loft C matched, 1 Dec 2026 to 30 Nov 2027, 16 900 / 2 800 / 33 800 CZK, due day 15 |
| 8.2 | Approve and save lease | Leases page with "Lease saved" banner and the new variable symbol |

## 9. Live data (uses the Apify token, 30 to 60 s each)

| # | Do | Expect |
|---|---|---|
| 9.1 | Properties → Vinohrady Residence → **Market rent** on Apt 1 | Market median and range from live listings, "x% below market", source links |
| 9.2 | Maintenance → **Find repairers** on the Apt 2 sink | 5 plumbers near Praha 2 with ratings; Contact shows a draft message marked "Not sent" |
| 9.3 | **Report an issue** (modal) for Apt 1, Electrical | Appears in the New column, sidebar badge goes up |

## 10. Reset

| # | Do | Expect |
|---|---|---|
| 10.1 | `pnpm db:seed` | Demo data back to the start for the real presentation |

If something fails: note the step number and what you saw.

## Last run: 13 Nov 2026 (production build)

All steps passed. Found and fixed during the run:
- Add unit rejected decimal areas ("47,5"); now accepted and rounded to whole m²
- After an import the drop area still showed the old file; it now clears
- Properties without units showed an empty table; now shows "No units yet"
- 30-day chart started its axis at zero; now zooms to the data
