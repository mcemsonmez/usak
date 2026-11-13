# usak

AI destekli kiralık mülk yönetim platformu (Grento benzeri). Tam plan: [`usak.pdf`](usak.pdf).

## Amaç

Tek daireli ev sahibinden büyük portföylere kadar kiralık mülk yönetimini kolaylaştırmak.
MVP tek bir soruyu çözer: **"Kim, hangi mülk için, ne kadar borçlu ve ödedi mi?"**

MVP kapsamı (Faz 1–4): mülk, birim ve kiracı kayıtları, sözleşmeler, aylık kira tahakkuku,
banka ekstresi (CSV) import ve otomatik ödeme eşleştirme, borç listesi, hatırlatma e-postaları,
basit dashboard.

MVP sonrası (Faz 5–8): AI asistan (sözleşme PDF'inden veri çıkarma, sohbet, sabah özeti),
kiracı portalı ve QR ile arıza bildirimi, giderler, sayaçlar, raporlar, Stripe abonelik,
REST API.

## Yol haritası

| Faz | Konu | Süre |
|---|---|---|
| 0 | Hazırlık: pazar, para birimi, dil seçimi, repo | ~3 gün |
| 1 | Auth + multi-tenant, veri şeması, uygulama kabuğu + i18n | 1 hafta |
| 2 | Mülk, birim, kiracı CRUD + CSV/Excel içe aktarma | 1 hafta |
| 3 | Sözleşmeler, aylık tahakkuk motoru, bitiş uyarıları | 1,5 hafta |
| 4 | Banka import, otomatik eşleştirme, borç takibi, dashboard: **MVP yayını** | 2 hafta |
| 5 | AI asistan | 2 hafta |
| 6 | Kiracı portalı, arıza bildirimi, belge deposu | 1,5 hafta |
| 7 | Giderler, sayaçlar, raporlar | 2 hafta |
| 8 | Ticarileştirme: abonelik, pazarlama sitesi, onboarding, API | 2 hafta |

## Planlanan stack

Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui · PostgreSQL + Drizzle ·
Better Auth · Zod · Inngest · Resend · Claude API · Vitest + Playwright · Vercel

## Kullanılabilir ürünler

Kullanım alanları öneri niteliğinde; hangisinin hangi fazda kullanılacağı henüz kesinleşmedi.

### Apify
- **Apify Store (Actors):** hazır scraper/otomasyonlar, ör. ilan sitelerinden kira verisi (kira tahmini)
- **Actors MCP Server:** Actor'ları AI asistana araç olarak açmak
- **Website Content Crawler:** kira hukuku, vergi ve banka dokümanlarını RAG için toplamak
- **RAG Web Browser:** asistanın güncel web bilgisiyle cevap vermesi
- **Browser Use:** API'si olmayan portallardan veri almak
- **Crawlee:** kendi crawler'larımızı TypeScript ile yazmak

### Featherless
- **Featherless API (OpenAI uyumlu):** açık modellerle ucuz LLM işleri (özet, sınıflandırma)
- **Vision modelleri:** taranmış sözleşme/makbuz görsellerinden veri çıkarma, arıza fotoğrafı sınıflandırma

### PostHog
- **AI Observability (LLM Analytics):** LLM çağrılarının maliyet, gecikme ve hata takibi
- **Product Analytics / Web Analytics:** özellik kullanımı, onboarding hunisi, site trafiği
- **Session Replay / Heatmaps:** beta kullanıcıların nerede takıldığını görmek
- **Feature Flags / Experiments:** özellikleri kademeli açmak, A/B testleri
- **Surveys:** beta kullanıcı geri bildirimi
- **Error Tracking / Logs:** hata ve sunucu log takibi (spec'teki Sentry'nin alternatifi)
- **Workflows / Data Warehouse:** olay bazlı otomasyon, veriyi birleştirip sorgulama
- **PostHog AI / PostHog MCP / Self-driving mode:** analitik veriye doğal dil ve MCP ile erişim

### PangeAI
- **Geospatial intelligence platformu:** mülk adreslerini konum verisiyle zenginleştirme,
  bölge analizi, kira tahmininde konum özellikleri

## Açık kararlar
- Hedef pazar (Türkiye mi, Çekya mı), para birimi ve diller
- Error tracking: Sentry mi PostHog mu?
- AI işlerinin Claude API ile Featherless arasında nasıl bölüneceği
- Apify ve PangeAI'nin hangi fazda devreye gireceği
