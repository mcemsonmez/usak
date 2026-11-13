# Sponsor products: where each one is used

| Product | What we use | Where in the app | Code |
|---|---|---|---|
| **Featherless** | OpenAI-compatible chat completions with the vision model **Qwen3-VL-30B-A3B-Instruct** | **AI lease import** (`/leases/import`, sidebar "AI lease import", Smart tools "Read a lease with AI"): reads a photo of a signed lease and fills tenant, unit, dates, rent, service charges, deposit, due day | `src/server/ai/featherless.ts`, `src/server/ai/extract-lease.ts`, `src/server/ai/lease-extraction.ts` |
| **Apify** | Actor **Google Maps Scraper** (`compass/crawler-google-places`) | **Maintenance → Find repairers**: plumbers, electricians, locksmiths… near the property, ranked by category and rating; Contact drafts a message | `src/server/maintenance/find-repairers.ts` |
| **Apify** | Actor **RAG Web Browser** (`apify/rag-web-browser`) | **Property page → Market rent**: searches live rental listings in the unit's district, median and middle half vs current rent, with source links | `src/server/apify/market-rent.ts` |
| **PostHog** | **LLM Analytics**: one `$ai_generation` event per AI call (model, provider, tokens, latency, errors; the image is never sent) | Every AI lease import | `src/server/ai/posthog.ts` |
| **PostHog** | **Product / Web Analytics** with posthog-js: pageviews on navigation, autocapture | Whole site and app | `src/components/posthog-provider.tsx` |
| PangeAI | Not used: no API key was available | – | – |

## In the UI
- Features using these products are labelled: **AI** (Featherless), **Live data** (Apify). Hover for a short explanation.
- Dashboard → **Smart tools** shows all of them in one row.

## Live demo notes
- Featherless: the lease read takes 5–20 s (model time about 5 s).
- Apify: Market rent 30–60 s, Find repairers about 30 s. Each run uses a few cents of Apify credit.
- PostHog: events appear under **LLM Analytics → Generations** (`lease_extraction`) and **Web analytics**.
- Keys live in `.env` (`FEATHERLESS_API_KEY`, `APIFY_TOKEN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`).
