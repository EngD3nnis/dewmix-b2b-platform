# TODO

Prioritized backlog. Pick from the top — items are roughly ordered by dependency.

This file matches the codebase as of the last reconciliation. If you discover something here that's already built, fix this file in the same PR.

✅ **Recently completed:**
- Multi-item quote basket → structured WhatsApp inquiry
- Inquiry persistence (`/inquiries` POST + admin pipeline at `/admin/inquiries`)
- Admin dashboard (products CRUD, categories, inquiries, analytics)
- Inquiry click tracking (`ProductEvent`) + live "top inquired" in admin analytics
- **Image upload pipeline hardened end-to-end** — Zod-validated presign with MIME allowlist; client-side resize to 1920px + JPEG re-encode + blur LQIP capture; multi-file drag-and-drop dropzone with per-file progress; drag-to-reorder; blur placeholder wired through to the public storefront
- **Queue infrastructure + admin SMS notifications** — BullMQ on Redis with global `QueueModule`, retry/backoff defaults, rate-limited workers; new `NotificationsModule` with `admin.inquiry.received` job kind, recipient resolution from admin users + env fallback, idempotent on inquiry reference number

---

## 🔴 P0 — Required for real launch

### 1. Deploy
Localhost is invisible. Deploy first; everything else gets meaningful only after a real URL exists.

**Steps:**
- Web → Vercel (free tier). Build command auto-detected.
- API → Render or Fly.io (free tier or ~$7/mo). Dockerfile already exists at `apps/api/Dockerfile`.
- Postgres → Neon or Supabase (free tier covers MVP comfortably).
- Redis → Upstash (free tier).
- Images → MinIO is fine for staging; for production move to Cloudflare R2 (S3-compatible, generous free egress). When you switch, add the R2 hostname to `apps/web/next.config.mjs` `images.remotePatterns`.
- Point a real domain (or a `.co.ke` subdomain) at the deployment.
- Run migrations and seed against the prod DB once.

**Why this is P0:** the single highest-leverage move. Until the URL is real, the business owner cannot share it with customers.

### 2. Run the schema migrations
Two schema additions ship in this iteration that need to be migrated:

```bash
pnpm db:migrate --name add_product_events_and_image_metadata
```

This covers (a) the `ProductEvent` table for inquiry tracking and (b) usage of the existing `width`/`height`/`blurDataUrl` columns on `ProductImage` (no schema change needed for those — Prisma already has them — but the storefront now reads them).

### 3. Real product data
The seed has 23 demo products. The owner needs to load their actual catalog. **This is not engineering work — it's data entry done from the admin.** Block 8–10 hours for the owner (or an admin assistant) to walk the warehouse with a phone. The image uploader now handles 12MP phone photos gracefully (auto-resize, multi-file drag-and-drop, progress bars), so this should be tolerable.

---

## 🟡 P1 — Big leverage, ship within the first 2 weeks

### 6. Typesense search wiring
`/search` currently does `LIKE %q%` in Postgres. At 4,000 SKUs this gets slow and has no typo tolerance.

**Where:**
- `apps/api/src/modules/search/` — new module fronting Typesense
- `apps/api/src/infrastructure/typesense/typesense.service.ts` — SDK wrapper
- Outbox worker: drain `OutboxEvent` → push to Typesense (the table is already there for this)
- `apps/web/src/app/search/page.tsx` — replace the DB query with the Typesense client

### 7. Featured products on homepage from real signal
Right now featured = `isFeatured: true` (admin manual). Add an auto-rank fallback by `ProductEvent` count over the last 7 days so the homepage stays fresh without curation.

### 8. Low-stock email/SMS alerts
The schema has `reorderLevel` on `Inventory`. The admin product list shows low-stock visually (P0 work). Push it: a daily digest SMS/email to the owner with what's running low. The queue + notifications infrastructure is now in place — add an `admin.low_stock_digest` job kind to `NotificationJob` and a BullMQ repeatable scheduler.

### 9. Orphaned upload cleanup
The presign endpoint hands out `products/{productId}/*.jpg` keys; if a user gets the presign, uploads, but then doesn't register (closed tab, error), the file sits in the bucket forever. Add a daily cron (BullMQ scheduled job) that:
1. Lists S3 keys under `products/_unbound/` older than 24h → delete
2. Lists S3 keys under `products/{productId}/` whose URL isn't in any `ProductImage` row → delete

This is not urgent (storage is cheap), but it'll matter at year 2.

---

## 🟢 P2 — Quality of life

### 10. Saved items (wishlist)
"Heart" icon on product cards exists but doesn't do anything. The schema already has a `SavedItem` table.

**Where:**
- `apps/api/src/modules/saved-items/` — new
- `apps/web/src/components/product/product-card.tsx` — wire the heart

### 11. Product reviews
The `Review` model exists. B2B contractors generally don't write reviews, but if the business wants social proof on the catalog, it's a low-effort feature.

### 12. Account sub-pages
Links exist (`/account/quotes`, `/account/saved`, `/account/addresses`, `/account/profile`) but show "Coming soon." Wire each one.

### 13. Footer / legal pages
`/about`, `/delivery`, `/help`, `/privacy`, `/suppliers`, `/terms`, `/bulk-orders` are stubs. Replace with real content from the business owner.

---

## 🔵 P3 — Post-launch features

- [ ] Product variants (paint colors, drill sizes) — schema ready
- [ ] Multi-warehouse inventory — schema ready
- [ ] Multiple delivery options (Sendy, G4S, own van)
- [ ] Email notifications (Resend or SES) — in addition to SMS
- [ ] Audit log viewer in admin
- [ ] Analytics: timeline charts (inquiries per day, conversion `NEW → WON`)
- [ ] Sitemap.xml + robots.txt
- [ ] Structured data (Schema.org Product) for SEO
- [ ] PWA manifest for "Add to home screen"
- [ ] Supplier onboarding flow (turn `Supplier` from passive table into active actor)
- [ ] AI moat: construction estimator that turns a project brief into a multi-product quote

---

## How to claim a task

1. Pick the top unclaimed P0/P1 item
2. Comment on the related GitHub issue (or create one if none exists)
3. Create a branch: `feat/<short-name>` from `dev`
4. Follow `CONTRIBUTING.md` and `CLAUDE.md`
5. Open PR against `dev` when done
6. Tick the box here and update `SETUP.md` if the build state changes

---

## Conventions reminder (full version in `CLAUDE.md`)

- IDs: UUIDv7 generated by Postgres
- Validation: Zod everywhere (shared via `@dewmix/types`)
- Auth: protected by default, `@Public()` to opt out
- Audit: every state-changing admin action writes to `AuditLog`
- Theming: semantic tokens (`bg-background`), never `bg-white`
- Test both light and dark mode before merging
- No public price display — `priceCents` lives in the schema for internal cost tracking only; never serialize it on public reads
