<<<<<<< HEAD
# Dewmix Hardware

B2B hardware & construction materials catalog for Kenya and East Africa.
Customers browse, suppliers inquire via WhatsApp. No public prices, no checkout, no payment gateway — by design.

> **Status:** MVP-ready. Storefront, multi-item quote-via-WhatsApp flow, admin dashboard, and inquiry tracking are all built. Remaining work to launch is deployment + image uploads + real product data.

📍 Kenol Road, Kenya · ☎️ 0787151516 · 💬 [WhatsApp](https://wa.me/254787151516)

---

## What this is (and isn't)

This is a **digital product catalog and inquiry system**, not an e-commerce store. The business does not want public prices, online checkout, or payment gateways — and the platform reflects that. Customers find the product they need, see specs and stock status, and contact the business through WhatsApp with a pre-filled, structured message that names the exact product and SKU.

There is no cart, no checkout, no payment integration, and no public price display anywhere in the codebase.

### ✅ Built
- Monorepo (Turborepo + pnpm) — `apps/web`, `apps/api`, shared packages
- Database schema (Prisma + Postgres 16, UUIDv7) — Users, Catalog, Inventory, Inquiries, ProductEvents, Suppliers, Reviews, AuditLog, OutboxEvent
- 23 seeded demo products across 10 categories (Bosch, Makita, DeWalt, Stanley, Crown Berger, Sadolin, Dulux, Bamburi, Mabati Rolling Mills, Devki)
- Storefront — homepage, product listing, category pages, product detail, search
- Design system — blue/white with dark mode, ShadCN primitives, mobile-first
- **Phone OTP authentication** (login, account shell, JWT cookies, SMS abstraction with Africa's Talking + console fallback)
- **Single-product WhatsApp inquiry** — "Order via WhatsApp" button with prefilled product name and SKU
- **Multi-item quote basket** — Zustand-persisted, structured WhatsApp message with reference number (`DWX-20260519-4821`)
- **Inquiry persistence** — public POST to `/inquiries` records every sent quote in the database for the admin pipeline
- **Inquiry click tracking** — `ProductEvent` rows on every WhatsApp tap and quote-add, feeds admin analytics
- **Admin dashboard** — overview, product CRUD (list, create, edit, image add/remove/reorder, feature toggle), category management, inquiry pipeline (`NEW → CONTACTED → QUOTED → WON/LOST`), analytics page with live "top inquired" + stock alerts + featured-product manager
- **Image upload pipeline** — Zod-validated presign with strict MIME allowlist (JPEG / PNG / WebP); client-side resize to 1920px + JPEG re-encode + 16×16 blur LQIP captured before upload; multi-file drag-and-drop dropzone with per-file progress; drag-to-reorder; blur placeholder consumed by `next/image` on cards and the detail page
- **AuditLog** on every state-changing admin action (including image add and remove)
- Docker Compose for local infra (Postgres, Redis, Typesense, MinIO)
- CI pipeline (GitHub Actions)

### 🟡 Partial / TODO
- **Search** — `/search` runs against the DB with `contains`. Typesense container is running but not wired (see `OutboxEvent` table)
- **SMS notifications** — Africa's Talking provider is wired for OTP, but no transactional sends (inquiry received, dispatched, etc.) yet
- **BullMQ workers** — Redis is up, no queue module exists

### ⛔ Intentionally out of scope
Cart, checkout, payments, M-Pesa, COD, order management, refunds. This is a catalog + inquiry platform, not a store.

📋 **Full prioritized backlog in [TODO.md](./TODO.md).**

---

## Quickstart

### Prerequisites

- **Node.js** 20+ (`nvm install 20`)
- **pnpm** 9+ (`npm i -g pnpm`)
- **Docker** + Docker Compose
- **Git**

### Setup (first time)

```bash
# 1. Clone and install
git clone <repo-url> dewmix-hardware
cd dewmix-hardware
pnpm install

# 2. Copy environment variables
cp .env.example .env

# 3. Start local infrastructure (Postgres, Redis, Typesense, MinIO)
pnpm docker:up

# 4. Wait ~10 seconds, then run migrations
pnpm db:migrate

# 5. Seed demo data (categories, products, admin user)
pnpm db:seed

# 6. Start everything in dev mode
pnpm dev
```

Open:
- **Storefront** → http://localhost:3000
- **Admin** → http://localhost:3000/admin
- **API** → http://localhost:4000
- **API docs** → http://localhost:4000/docs
- **Prisma Studio** → `pnpm db:studio` → http://localhost:5555
- **MinIO Console** → http://localhost:9001 (login: `dewmix` / `dewmix-secret`)
- **Typesense** → http://localhost:8108

### Daily development

```bash
pnpm dev                # Start everything
pnpm dev --filter=web   # Frontend only
pnpm dev --filter=api   # Backend only

pnpm lint               # Lint all packages
pnpm typecheck          # Type-check all packages
pnpm test               # Run all tests
pnpm format             # Format with Prettier
```

---

## Repository structure

```
dewmix-hardware/
├── apps/
│   ├── api/                # NestJS backend (modules: auth, catalog, admin, inquiries, events, uploads, health)
│   └── web/                # Next.js storefront + admin
├── packages/
│   ├── db/                 # Prisma schema + client
│   ├── types/              # Shared TS types & Zod schemas (DTOs)
│   ├── utils/              # Pure utility functions
│   └── config/             # Shared ESLint, TS, Tailwind configs
├── infrastructure/
│   └── docker/             # Postgres init scripts, etc.
├── .github/workflows/      # CI/CD
├── ARCHITECTURE.md         # System architecture blueprint
├── CLAUDE.md               # Engineering constitution
├── MVP_STRATEGY.md         # 48-hour ship plan
└── docker-compose.yml      # Local dev infrastructure
```

---

## How the inquiry flow works

1. Customer browses the catalog (`/products`, `/categories/:slug`, `/search`).
2. On a product card, they tap **Add to Quote** (multi-item) — or on the product detail page, **Inquire on WhatsApp** for a single-product inquiry.
3. Each tap fires a `ProductEvent` row (fire-and-forget `sendBeacon`) so the admin sees what's getting attention.
4. From the quote basket they tap **Send Quote via WhatsApp**. The browser opens WhatsApp with a structured message listing every item with name, SKU, and quantity, plus a reference number (`DWX-YYYYMMDD-XXXX`).
5. The same payload is POSTed to `/api/v1/inquiries` so the admin pipeline at `/admin/inquiries` shows the full request and the admin can mark it `CONTACTED → QUOTED → WON/LOST`.

Single-product inquiries go straight to WhatsApp without hitting the basket; they're still tracked as `ProductEvent` rows so the admin sees demand even when nothing is "sent" through the basket flow.

---

## Documentation

- **[README.md](./README.md)** — this file
- **[SETUP.md](./SETUP.md)** — what's built, what's not, sanity checks
- **[TODO.md](./TODO.md)** — prioritized backlog
- **[MVP_STRATEGY.md](./MVP_STRATEGY.md)** — 48-hour ship plan and product strategy
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — workflow, branches, PR standards
- **[CLAUDE.md](./CLAUDE.md)** — engineering constitution + AI coding rules
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — full system architecture blueprint
- **API docs (Swagger)** — http://localhost:4000/docs when the API is running

---

## Tech stack

Next.js 15 · React 19 · TypeScript (strict) · TailwindCSS · ShadCN UI · NestJS 10 · PostgreSQL 16 · Prisma · Redis · Typesense · MinIO/S3 · Africa's Talking SMS · Docker · pnpm + Turborepo

---

## Contact

- **Business:** Dewmix Hardware, Kenol Road, Kenya
- **Phone:** 0787151516
- **WhatsApp:** https://wa.me/254787151516
=======
# dewmix-b2b-platform
Scalable B2B hardware commerce platform built with Next.js, NestJS, PostgreSQL, Prisma, Redis, and TurboRepo.


![Next.js](https://img.shields.io/badge/Next.js-15-black)
![NestJS](https://img.shields.io/badge/NestJS-Backend-red)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![Redis](https://img.shields.io/badge/Redis-Queue-red)
![Docker](https://img.shields.io/badge/Docker-Containerization-blue)

---

## Overview

Dewmix is a scalable B2B marketplace platform designed for hardware suppliers, wholesalers, and enterprise commerce workflows.

Built using a modern monorepo architecture with production-oriented tooling and scalable backend infrastructure.

---

## Features

- Product catalog management
- Inquiry workflow system
- Admin dashboard
- Authentication system
- Image upload pipeline
- Analytics/events tracking
- Queue processing with Redis/BullMQ
- Responsive UI
- Dockerized services
- Monorepo architecture
- CI-ready deployment setup

---

## Tech Stack

### Frontend
- Next.js 15
- TypeScript
- TailwindCSS

### Backend
- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ

### Infrastructure
- TurboRepo
- Docker
- GitHub Actions

---

## Monorepo Structure

```bash
/apps
  /web
  /api

/packages
  /ui
  /config
  /types

/infrastructure
```

---

## Local Development

### 1. Clone repository

```bash
git clone https://github.com/YOUR_USERNAME/dewmix-hardware.git
cd dewmix-hardware
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

### 4. Start development servers

```bash
pnpm dev
```

---

## Deployment

Production-ready Docker architecture included.

Recommended deployment stack:
- Vercel (frontend)
- Railway/Render (backend)
- Neon/Supabase (PostgreSQL)
- Upstash (Redis)

---

## Architecture Goals

- Scalable
- Modular
- Maintainable
- Production-oriented
- Enterprise-expandable

---

## Current Status

MVP nearing production deployment.

---

## Future Roadmap

- Payments integration
- Supplier portals
- Inventory syncing
- Advanced search
- AI recommendations
- Multi-vendor support
- Order management
- Logistics integrations

---

## License

Private / Proprietary
>>>>>>> 0acb210090b27c6541e67a9379b1ef3a75548d0b
