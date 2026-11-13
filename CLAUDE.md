# Proje: Kiralık Mülk Yönetim Platformu (usak)

Grento benzeri, AI destekli kiralık mülk yönetim platformu. Tam plan ve faz promptları:
`usak.pdf`. Proje açıklaması, yol haritası ve kullanılabilir ürünler: `README.md`.

Durum: kod henüz yok. İlk adım Faz 0 / Prompt 0.1 (proje iskeleti).

## Stack (planlanan)
Next.js 15 App Router, TypeScript strict, Tailwind + shadcn/ui,
Drizzle + PostgreSQL, Better Auth, Zod, Inngest, Resend, Vitest, Playwright.

Kullanılabilir dış ürünler (detaylar README'de): Apify (Actors, Actors MCP Server,
Website Content Crawler, RAG Web Browser, Browser Use, Crawlee), Featherless (OpenAI uyumlu
API, vision modelleri), PostHog (LLM Analytics, Product/Web Analytics, Session Replay,
Heatmaps, Feature Flags, Experiments, Surveys, Error Tracking, Logs, Workflows, Data
Warehouse, PostHog AI, MCP), PangeAI (geospatial intelligence).

## Kurallar
- Her tablo `organizationId` içerir; her sorgu bununla filtrelenir (multi-tenant).
- Para tutarları integer (kuruş/haléř) olarak saklanır, asla float değil.
- Tarihler UTC saklanır, UI'da kullanıcının saat diliminde gösterilir.
- Server Actions Zod ile validasyon yapar.
- UI metinleri i18n dosyasından gelir (tr, en, cs).
- Yeni özellik = test ile birlikte.
- AI çıktıları asla doğrudan yazılmaz; öneri + kullanıcı onayı + audit log.
- Faz 4'ten (MVP) önce kapsam dışı özellik eklenmez.

## Komutlar (iskelet kurulunca)
- `pnpm dev` / `pnpm test` / `pnpm e2e` / `pnpm db:migrate` / `pnpm lint`

## Klasör yapısı (planlanan)
src/app (sayfalar), src/server (iş mantığı), src/db (şema), src/components

## Çalışma düzeni
Her faz bir branch, her adım (prompt) bir commit. Önce plan, sonra kod, sonra test,
sonra commit.
