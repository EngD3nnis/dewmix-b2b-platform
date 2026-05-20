# Deployment runbook

The shortest path from "code in repo" to "live URL". Roughly 90 minutes if you have credit cards and accounts ready; 2.5 hours if you're signing up to providers for the first time.

**The plan**

| Layer       | Provider          | Free tier sufficient? |
|-------------|-------------------|----------------------|
| Web         | Vercel            | Yes                  |
| API         | Render or Fly.io  | Yes ($7/mo recommended on Render to avoid sleep) |
| Postgres    | Neon              | Yes                  |
| Redis       | Upstash           | Yes                  |
| Images      | Cloudflare R2     | Yes (10GB + zero egress) |
| SMS         | Africa's Talking  | Sandbox free, prod ~KSh 1/SMS |

Total recurring cost at launch: roughly **$0–$10 / month** until traffic justifies upgrading.

---

## Step 0 — Prerequisites (15 min, one-time)

Sign up for:
- [Vercel](https://vercel.com) — link your GitHub
- [Render](https://render.com) — link your GitHub
- [Neon](https://neon.tech)
- [Upstash](https://upstash.com)
- [Cloudflare](https://cloudflare.com) — for R2 you need to add a payment method even if you stay in the free tier
- [Africa's Talking](https://account.africastalking.com) — sandbox first; promote to live when ready

Push the repo to GitHub if it's not already there:

```bash
git remote add origin git@github.com:YOUR-ORG/dewmix-hardware.git
git push -u origin main
```

---

## Step 1 — Provision the database (5 min)

1. In Neon, create a new project called `dewmix`.
2. From the dashboard, copy two connection strings:
   - **Pooled** connection → this becomes `DATABASE_URL`
   - **Direct** connection → this becomes `DIRECT_URL` (needed for migrations)
3. Keep these tabs open — you'll paste them into Render and Vercel shortly.

---

## Step 2 — Provision Redis (3 min)

1. In Upstash, create a database. Pick a region close to your API region (e.g. EU-West if your API is on Render Frankfurt).
2. Copy the **Redis URL** (starts with `rediss://`) — this becomes `REDIS_URL`.

---

## Step 3 — Provision object storage (10 min)

1. In Cloudflare, go to R2 → Create bucket → `dewmix-images`.
2. R2 → Manage R2 API Tokens → Create API token → object-read + object-write on `dewmix-images`.
3. Save the access key, secret key, and the S3 endpoint URL (`https://ACCOUNT_ID.r2.cloudflarestorage.com`).
4. In the bucket settings → Public access → enable a public dev URL (or attach a custom subdomain like `images.dewmixhardware.co.ke`).
5. **Edit `apps/web/next.config.mjs`** — add your R2 public hostname to `images.remotePatterns`:

   ```js
   { protocol: 'https', hostname: 'images.dewmixhardware.co.ke' },
   // or if using the r2.dev URL:
   { protocol: 'https', hostname: 'pub-XXXX.r2.dev' },
   ```

   Commit and push.

---

## Step 4 — Deploy the API (15 min)

1. Render → New → Web Service → connect the `dewmix-hardware` repo.
2. Configure:
   - **Name:** `dewmix-api`
   - **Region:** pick one close to your Neon DB
   - **Branch:** `main`
   - **Root directory:** leave blank
   - **Runtime:** Docker
   - **Dockerfile path:** `apps/api/Dockerfile`
3. **Environment variables** — paste from `.env.production.example`. Critical ones:
   - `DATABASE_URL` and `DIRECT_URL` from Neon
   - `REDIS_URL` from Upstash
   - `S3_*` from Cloudflare R2
   - `JWT_SECRET` — generate with `openssl rand -base64 48` and paste the output
   - `NEXT_PUBLIC_SITE_URL` — your future Vercel URL (e.g. `https://dewmixhardware.co.ke`); used for CORS
   - `ADMIN_NOTIFICATION_PHONE` = `254787151516`
   - `PUBLIC_WEB_URL` = the same Vercel URL
   - `NODE_ENV=production`
4. Click **Create Web Service**. First deploy takes 4–6 minutes.
5. Once green, note the URL (e.g. `https://dewmix-api.onrender.com`) — you'll need it for Vercel.

> If the deploy fails with "JWT_SECRET is still the .env.example placeholder," good — the safety guard is working. Generate a real secret and redeploy.

---

## Step 5 — Generate and apply migrations (5 min)

The schema has never been migrated against a real DB. Do this exactly once.

From your local machine, with the Neon `DIRECT_URL` exported:

```bash
export DATABASE_URL="<paste Neon DIRECT URL here>"
export DIRECT_URL="<same value>"

pnpm install
pnpm db:generate
pnpm db:migrate --name init
```

This creates `packages/db/prisma/migrations/<timestamp>_init/migration.sql` — commit and push it. From now on Render will run migrations automatically on each deploy (the Dockerfile runs `pnpm db:generate`; for `migrate deploy` you'll want to add a build hook — see "Step 9" below).

Then seed:

```bash
export SEED_ADMIN_PASSWORD="pick-something-the-owner-will-remember"
pnpm db:seed
```

The seed script will print the admin password once. Save it.

---

## Step 6 — Deploy the web app (10 min)

1. Vercel → Add New → Project → import the same GitHub repo.
2. Configure:
   - **Framework preset:** Next.js (auto-detected)
   - **Root directory:** `apps/web`
   - **Build command:** leave default (`next build`)
   - **Install command:** `cd ../.. && pnpm install --frozen-lockfile`
3. **Environment variables** — these are the `NEXT_PUBLIC_*` group:
   - `NEXT_PUBLIC_API_URL` = your Render API URL from Step 4
   - `NEXT_PUBLIC_SITE_URL` = your eventual Vercel URL (you'll edit this after the first deploy if it changes)
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` = `254787151516`
   - `NEXT_PUBLIC_CONTACT_PHONE` = `0787151516`
   - `NEXT_PUBLIC_BUSINESS_ADDRESS` = `Kenol Road, Kenya`
4. Deploy. ~3 minutes.

---

## Step 7 — Verify (5 min)

Open the Vercel URL. You should see the homepage with the blue Dewmix mark, real category tiles, and seeded products from the demo data. Tap any product, then "Add to Quote," then "Send via WhatsApp" — WhatsApp should open with a structured message.

On the API side: `https://dewmix-api.onrender.com/health` should return:

```json
{ "status": "ok", "checks": { "db": "up" }, ... }
```

If the storefront says "no products" or shows infinite spinners, the most common cause is a CORS misconfiguration — confirm `NEXT_PUBLIC_SITE_URL` on the API matches the actual Vercel URL exactly (no trailing slash).

---

## Step 8 — Domain + production smoke test (15 min)

1. Buy/point a domain at Vercel (`dewmixhardware.co.ke` or similar).
2. Add the same domain as a custom domain in the Vercel project.
3. Update `NEXT_PUBLIC_SITE_URL`, `PUBLIC_WEB_URL`, and CORS origin (`NEXT_PUBLIC_SITE_URL` env in Render) to the new domain.
4. Update `COOKIE_DOMAIN` in Render to `.dewmixhardware.co.ke` (leading dot) and `COOKIE_SECURE=true`.
5. Redeploy both.
6. **From the owner's actual phone**, send a quote inquiry. Confirm the SMS lands on `ADMIN_NOTIFICATION_PHONE` within 30 seconds.

If the SMS doesn't arrive:
- Check Render logs for `Sent inquiry-received SMS to N admin(s)` — if missing, the BullMQ worker may not be processing (check Redis URL).
- Check the Africa's Talking dashboard for delivery status.
- If `AT_API_KEY` is blank, the console SMS provider is in use — no real SMS will send. Set the key.

---

## Step 9 — Migrations on subsequent deploys (5 min, optional but recommended)

Right now migrations run from your laptop. To make Render run them automatically on every deploy:

1. Render service → Settings → **Pre-Deploy Command**:
   ```
   cd apps/api && npx prisma migrate deploy --schema=../../packages/db/prisma/schema.prisma
   ```
2. Save. Next deploy will apply any pending migration.

---

## You're live

What to do in the first 24 hours:

- The owner opens `/admin` from a phone and adds 10–20 real products (test the experience end-to-end before loading the full catalog).
- Send the URL to one friendly customer; ask them to send an inquiry; verify the WhatsApp message looks right.
- Check `/admin/analytics` the next day — the "Most inquired" panel should have real data.

What's deferred:

- Sentry / error monitoring
- Tests
- Typesense search
- Account sub-pages (`/account/profile`, `/account/saved`, etc — still ComingSoon, only visible to logged-in users)
- Suppliers/bulk-orders pages (still ComingSoon — low traffic)

These are tracked in `TODO.md`.

---

## Quick rollback

If something is badly broken after a deploy:

- **Web:** Vercel → Deployments → previous green deploy → "Promote to Production."
- **API:** Render → Manual Deploy → select a previous commit.
- **DB:** Neon has automatic point-in-time backups on its free tier — restore from a snapshot if a migration corrupted data.

Don't be a hero in a panic. Roll back, then debug locally.
