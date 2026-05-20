# SETUP — what's built and how to run it

This is the MVP-ready foundation for **Dewmix Hardware** — a B2B hardware catalog with WhatsApp-based inquiry, not a traditional e-commerce store. It runs end-to-end: Postgres → Prisma → NestJS API → Next.js storefront with admin dashboard, blue/white theme, and dark mode.

---

## What's working out of the box

### Infrastructure (Docker Compose)
- ✅ PostgreSQL 16 with UUIDv7 support + extensions enabled
- ✅ Redis 7 (cache + queue backend — running, not yet wired into a module)
- ✅ Typesense (search engine — running, not yet wired)
- ✅ MinIO (S3-compatible local object storage)
- ✅ Auto-creates `dewmix-images` bucket with public read

### Database (`packages/db`)
- ✅ Complete Prisma schema — Users, Catalog, Inventory, Inquiries, ProductEvents (analytics), Suppliers, Reviews, SavedItems, AuditLog, OutboxEvent
- ✅ Seed script with 23 real Kenyan hardware products across 10 categories
- ✅ Brands: Bosch, Makita, DeWalt, Stanley, Crown Berger, Sadolin, Dulux, Bamburi, Mabati Rolling Mills, Devki
- ⚠️ **There is NO Order, Cart, or Payment model.** This is a catalog + inquiry platform by design.
- ⚠️ `priceCents` on `Product` is for internal cost tracking only — it must never be serialized on public API responses.

### Backend (`apps/api`)
Modules in `apps/api/src/modules/`: `auth`, `catalog`, `admin`, `inquiries`, `events`, `uploads`, `health`.

- ✅ NestJS skeleton with structured logging (Pino), Helmet, CORS, Throttling, Swagger
- ✅ `GET /health`
- ✅ `GET /api/v1/products` — paginated, filterable listing
- ✅ `GET /api/v1/products/:slug` — product detail
- ✅ `GET /api/v1/categories` — category listing
- ✅ Auth endpoints: `POST /api/v1/auth/otp/request`, `POST /api/v1/auth/otp/verify`, refresh-token rotation, Argon2id-hashed OTPs, 1/min rate-limit per phone, auto-creates user on first verify (passwordless), JWT in HttpOnly cookie
- ✅ Admin endpoints: stats, full product CRUD with audit logging, image add/remove/reorder, category CRUD, inquiry list/filter/status update
- ✅ `POST /api/v1/inquiries` — public submission of multi-item WhatsApp inquiry (idempotent on `referenceNumber`)
- ✅ `POST /api/v1/events/product` — public, anonymous click tracking (`sendBeacon`-friendly)
- ✅ `GET /api/v1/admin/analytics/top-inquired` — top N products by event count over a window
- ✅ `GET /api/v1/admin/analytics/event-totals` — totals by kind over a window
- ✅ Zod validation pipe (consistent with web validation)
- ✅ Cache-Control headers on public reads
- ✅ Prisma global module
- ✅ Dockerfile for production deployment

### Frontend (`apps/web`)
- ✅ Next.js 15 App Router with React 19, RSC by default
- ✅ Blue/white design system via HSL CSS variables
- ✅ Dark mode toggle (light / dark / system) via `next-themes`
- ✅ ShadCN primitives: Button, Card, Input, Badge, DropdownMenu, QuantityStepper
- ✅ Full responsive header with desktop nav, mobile drawer, search, theme toggle, quote-basket icon, user menu
- ✅ Footer with brand info, link groups, WhatsApp CTA
- ✅ Floating WhatsApp FAB (linked to 0787151516)
- ✅ Homepage: hero with search, categories grid (live from API), featured products (live from API), "Why Dewmix" features, quote CTA panel for B2B
- ✅ Product listing page (`/products`)
- ✅ Category page (`/categories/[slug]`)
- ✅ Product detail page with gallery, specs, MOQ, stock badge, **Add to Quote** primary CTA, **Inquire on WhatsApp** + **Call** secondary actions, sticky mobile bar — no price displayed anywhere
- ✅ Quote basket (Zustand-persisted) — header badge, drawer, dedicated `/quote` page
- ✅ Quote submission → POSTs to `/inquiries` + opens WhatsApp with structured message containing reference number
- ✅ Inquiry click tracking — `sendBeacon` POST on every WhatsApp tap and quote-add
- ✅ Search page (`/search` — currently DB `contains`, ready to swap for Typesense)
- ✅ Admin shell at `/admin` with full pages for products (list/new/edit), categories, inquiries (with status pipeline), analytics
- ✅ 404 + error boundary pages
- ✅ Type-safe environment variables
- ✅ Typed API client
- ✅ SEO metadata, OpenGraph, Twitter cards
- ✅ Accessibility: skip-to-main link, focus rings, semantic landmarks
- ✅ Security headers (X-Frame-Options, CSP-ready, etc.)

### Tooling
- ✅ Turborepo task pipeline
- ✅ pnpm workspaces (4 packages)
- ✅ Shared TypeScript base config (strict, `noUncheckedIndexedAccess`)
- ✅ Shared types package with Zod schemas
- ✅ Shared utils package (phone, WhatsApp helpers)
- ✅ Prettier with Tailwind plugin
- ✅ GitHub Actions CI (lint + typecheck + build with Postgres service)
- ✅ VS Code workspace settings + recommended extensions
- ✅ `CLAUDE.md` engineering constitution

---

## First-time setup (5 minutes)

```bash
# 1. Install
cd dewmix-hardware
pnpm install

# 2. Environment
cp .env.example .env

# 3. Start infrastructure
pnpm docker:up

# 4. Generate Prisma client + migrate + seed
pnpm db:generate
pnpm db:migrate       # creates the initial migration + the ProductEvent migration
pnpm db:seed          # loads 23 demo products

# 5. Run everything
pnpm dev
```

Then visit:

| Surface | URL |
|---|---|
| Storefront | http://localhost:3000 |
| All products | http://localhost:3000/products |
| Category | http://localhost:3000/categories/power-tools |
| Search | http://localhost:3000/search?q=drill |
| Quote basket page | http://localhost:3000/quote |
| Admin overview | http://localhost:3000/admin |
| Admin products | http://localhost:3000/admin/products |
| Admin inquiries | http://localhost:3000/admin/inquiries |
| Admin analytics | http://localhost:3000/admin/analytics |
| API health | http://localhost:4000/health |
| API docs (Swagger) | http://localhost:4000/docs |
| Prisma Studio | `pnpm db:studio` |
| MinIO console | http://localhost:9001 |

---

## What's intentionally not done yet

These are the remaining features in priority order. `CLAUDE.md` has the conventions, `TODO.md` has the full backlog.

### Deployment
- [ ] Vercel (web) + Render or Fly (API) + Neon/Supabase (Postgres) + Upstash (Redis)
- [ ] Real domain (`dewmixhardware.co.ke` or similar)
- [ ] Production env file template
- [ ] Sentry DSN

### Image upload (P0 — the only major workflow not wired end-to-end)
- [ ] Presigned-POST endpoint in the `uploads` module
- [ ] Admin drag/drop uploader
- [ ] Wire to the product editor
- [ ] Optional: `sharp`-based resize worker via BullMQ

### Search
- [ ] `search` module fronting Typesense
- [ ] Outbox worker: `OutboxEvent` → Typesense
- [ ] Swap `/search` from DB `contains` to Typesense

### Notifications
- [ ] `notifications` module
- [ ] Hook into `InquiriesController.create` — SMS the admin on every new inquiry
- [ ] Daily low-stock digest

### Stretch
- [ ] Saved items wiring
- [ ] Account sub-pages (currently "Coming soon")
- [ ] Footer/legal pages (currently stubs)
- [ ] Product variants
- [ ] Multi-warehouse

---

## Architecture decisions that may surprise you

**No cart, no checkout, no payments — by design.** This is a catalog + inquiry platform. The business does not want public prices or online transactions. WhatsApp is the conversion channel. If you find yourself building any of those, stop — that's a different product.

**`priceCents` exists in the schema but is never publicly displayed.** It's there so the admin can track cost basis and run internal margin analysis later. Public API responses must never serialize it.

**Two parallel inquiry paths.** Single-product via `WhatsAppInquiryButton` / `TrackedWhatsAppLink` (no basket, instant WhatsApp deeplink) and multi-product via the quote basket. Both emit `ProductEvent` rows for tracking. The quote basket additionally POSTs an `Inquiry` row so the admin pipeline shows what was sent. Pick the right CTA for the surface: cards use the basket flow; the detail page exposes both.

**Phone-first auth, not email.** See `packages/types/src/index.ts` — the `PhoneSchema` normalizes to international format. Email is optional everywhere. WhatsApp requires a phone number anyway.

**No Redis or Typesense usage yet in code.** The containers are running but the modules aren't wired. This was deliberate — the schema, API, and UI should be solid before layering caches. Premature caching causes bugs that look like business logic problems.

**Server Components everywhere except interactivity.** The header, theme toggle, WhatsApp FAB, quote basket, and the new tracked WhatsApp link are the only `'use client'` components. Product cards, layouts, footers, the product detail page — all server. This keeps the JS bundle tiny.

**`OutboxEvent` table is here but unused.** It's the foundation for the eventual Typesense sync. When you add the search module, the products service writes to this table inside the same transaction; a worker drains it to Typesense. Bulletproof eventual consistency.

**Click tracking uses `sendBeacon`.** Every WhatsApp tap and quote-add fires a fire-and-forget POST to `/api/v1/events/product`. The browser queues the request and delivers it after the current frame, so it never blocks the user. The endpoint hashes IPs daily-salted so we can de-duplicate burst clicks without storing PII.

---

## Sanity check

After `pnpm dev`, you should see:

1. **Homepage** at http://localhost:3000 with the blue Dewmix mark in the header
2. **Categories grid** populated with 10 hardware categories (icons + names)
3. **Featured products** with products showing — no prices anywhere
4. **Theme toggle** in the header — click it, dark mode swaps instantly without flicker
5. **Mobile menu** when you resize narrow — hamburger reveals nav drawer
6. **WhatsApp button** bottom-right with a subtle ping animation
7. **Click a product card → Add to Quote** → quote basket badge appears in the header
8. **Open the basket → Send via WhatsApp** → WhatsApp opens with a structured message; an `Inquiry` row is recorded in the DB; `ProductEvent` rows are recorded for every item
9. **Open a product detail page → Inquire on WhatsApp** → WhatsApp opens with `"Hello, I would like to inquire about [name] (SKU: ...)."`; a `ProductEvent` row is recorded
10. **`/admin/inquiries`** — your test inquiry appears with status `NEW`, can be moved through `CONTACTED → QUOTED → WON/LOST`
11. **`/admin/analytics`** — the "Most inquired products" panel shows live data the moment events have landed
12. **Swagger docs** at http://localhost:4000/docs

If any of these don't work, the most likely culprit is the API not being reachable — check the `pnpm docker:up` logs first, then the API logs.
