# Dewmix Hardware — Architecture Blueprint

> Premium hardware & construction materials commerce platform for Africa.
> Kenol Road, Kenya → East Africa.
> Built for 4,000 SKUs at launch, engineered for 100k+ concurrent users.
> This document is the single source of truth for engineering decisions.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Production-Grade Folder Structure](#2-production-grade-folder-structure)
3. [Scalable Database Schema](#3-scalable-database-schema)
4. [Admin Dashboard Architecture](#4-admin-dashboard-architecture)
5. [Search Architecture](#5-search-architecture)
6. [Caching Strategy](#6-caching-strategy)
7. [Image Optimization Strategy](#7-image-optimization-strategy)
8. [Deployment Strategy](#8-deployment-strategy)
9. [Security Best Practices](#9-security-best-practices)
10. [UI/UX Design System](#10-uiux-design-system)
11. [Performance Optimization Plan](#11-performance-optimization-plan)
12. [Roadmap: MVP → Enterprise](#12-roadmap-mvp--enterprise)
13. [AI-Assisted Coding Workflow with Claude](#13-ai-assisted-coding-workflow-with-claude)

---

## 1. System Architecture Overview

### Core philosophy

A **modular monolith** for the backend, not microservices on day one. NestJS modules give you logical separation (auth, products, orders, payments) with the deployment simplicity of one service. When a module's traffic, team, or scaling profile diverges from the rest — extract it. Premature microservices kill startups.

The frontend is a **Next.js App Router application** that treats Server Components as the default and Client Components as the exception. Most of the page weight ships as HTML, not JavaScript. This matters on African mobile networks where every kilobyte costs the user money.

### High-level topology

```
                    ┌──────────────────────┐
                    │   Cloudflare CDN     │
                    │   (edge cache + WAF) │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
        ┌─────▼─────┐   ┌──────▼──────┐  ┌─────▼──────┐
        │  Next.js  │   │   Images    │  │  Static    │
        │  (Vercel  │   │ (S3 + CDN)  │  │  Assets    │
        │   or ECS) │   └─────────────┘  └────────────┘
        └─────┬─────┘
              │ HTTPS (signed JWT)
              │
        ┌─────▼──────────────────────────────────┐
        │      NestJS API (ECS Fargate)          │
        │  ┌──────────────────────────────────┐  │
        │  │ Modules: auth │ catalog │ cart   │  │
        │  │ orders │ payments │ search │ ... │  │
        │  └──────────────────────────────────┘  │
        └─┬──────────┬──────────┬─────────┬──────┘
          │          │          │         │
     ┌────▼───┐ ┌────▼────┐ ┌───▼───┐ ┌───▼────┐
     │Postgres│ │  Redis  │ │Type-  │ │ BullMQ │
     │  (RDS) │ │(Cache + │ │sense  │ │workers │
     │+replica│ │ pubsub) │ │       │ │        │
     └────────┘ └─────────┘ └───────┘ └────────┘
                                          │
                                    ┌─────▼─────┐
                                    │ S3, SES,  │
                                    │ M-Pesa,   │
                                    │ SMS, etc. │
                                    └───────────┘
```

### Why each piece exists

| Component | Role | Why this choice |
|---|---|---|
| Next.js App Router | Public storefront + admin shell | RSC by default = small bundles, fast TTFB, native streaming |
| NestJS | API + business logic | DI, modules, decorators force structure; easy team scaling |
| PostgreSQL | System of record | ACID, JSONB for flexible specs, mature on AWS RDS |
| Prisma | ORM + migrations | Type-safe queries, schema-first, generates client |
| Redis | Cache, sessions, queues, pubsub | One service, four jobs — keeps infra lean |
| Typesense | Product search | Faster than Elasticsearch, simpler ops, typo tolerance built-in |
| BullMQ | Async jobs | Image processing, emails, M-Pesa polling, analytics rollups |
| S3 + CloudFront | Image + asset storage | Cheap, durable, globally cached |
| Docker | Packaging | Reproducible builds, one image dev → prod |

### Data flow examples

**Product page request** — Cloudflare edge → if cached, return HTML. If miss, hit Next.js → RSC fetches from Redis (1ms) or Postgres (10ms) → render → store in Next.js Data Cache + Cloudflare for 60s.

**Search query** — Client → Next.js route handler → Typesense (sub-50ms) → response → SWR caches in browser.

**Checkout** — Client → API → validate cart → reserve inventory (DB transaction) → create order (pending) → return M-Pesa STK push request → Safaricom prompts user → callback hits webhook → mark paid → enqueue confirmation jobs → respond to client polling.

---

## 2. Production-Grade Folder Structure

Use a **pnpm monorepo with Turborepo**. One repo, multiple apps, shared packages. This is what serious companies do — it prevents "the frontend types drifted from the backend" hell.

### Root

```
hardware-marketplace/
├── apps/
│   ├── web/                    # Next.js storefront + admin
│   ├── api/                    # NestJS backend
│   └── workers/                # BullMQ background workers (separate process)
├── packages/
│   ├── db/                     # Prisma schema + generated client
│   ├── types/                  # Shared TS types (DTOs, enums)
│   ├── ui/                     # Shared React component library (optional)
│   ├── config/                 # ESLint, TS, Tailwind shared configs
│   └── utils/                  # Pure utility functions (currency, dates)
├── infrastructure/
│   ├── docker/                 # Dockerfiles per app
│   ├── terraform/              # IaC (when ready)
│   └── scripts/                # Deployment, seed, backup scripts
├── .github/workflows/          # CI/CD pipelines
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### `apps/web` (Next.js)

```
apps/web/src/
├── app/
│   ├── (storefront)/
│   │   ├── layout.tsx               # Storefront chrome (header, footer)
│   │   ├── page.tsx                 # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx             # Listing with filters
│   │   │   └── [slug]/page.tsx      # Product detail
│   │   ├── categories/[slug]/page.tsx
│   │   ├── search/page.tsx
│   │   ├── cart/page.tsx
│   │   └── checkout/page.tsx
│   ├── (account)/
│   │   ├── layout.tsx               # Auth guard
│   │   ├── orders/
│   │   ├── saved/
│   │   └── quotes/
│   ├── admin/
│   │   ├── layout.tsx               # Admin shell + RBAC guard
│   │   ├── dashboard/page.tsx
│   │   ├── products/
│   │   ├── orders/
│   │   ├── inventory/
│   │   ├── categories/
│   │   ├── suppliers/
│   │   ├── customers/
│   │   ├── uploads/                 # Bulk CSV/Excel
│   │   └── analytics/
│   ├── api/
│   │   ├── auth/[...nextauth]/      # If using NextAuth
│   │   ├── webhooks/mpesa/          # M-Pesa callback
│   │   └── revalidate/              # ISR webhook
│   ├── layout.tsx                   # Root layout
│   ├── error.tsx
│   ├── not-found.tsx
│   └── globals.css
├── components/
│   ├── ui/                          # ShadCN primitives (button, dialog, etc.)
│   ├── layout/                      # Header, Footer, MobileNav
│   ├── product/                     # ProductCard, ProductGallery, SpecsTable
│   ├── search/                      # SearchBar, Filters, FacetSidebar
│   ├── cart/                        # CartDrawer, LineItem, MiniCart
│   ├── checkout/                    # AddressForm, PaymentSelector
│   ├── admin/                       # Table, BulkEditor, StatCard, Charts
│   └── shared/                      # EmptyState, ErrorBoundary, Spinner
├── lib/
│   ├── api/
│   │   ├── client.ts                # Typed fetch wrapper
│   │   ├── products.ts              # Server-side data fetchers
│   │   ├── cart.ts
│   │   └── ...
│   ├── auth/                        # Session helpers
│   ├── hooks/                       # useCart, useDebouncedSearch, etc.
│   ├── analytics/                   # Event tracking
│   ├── seo/                         # metadata builders, structured data
│   └── utils/                       # cn(), formatCurrency, formatDate
├── stores/                          # Zustand stores (cart, ui-state)
├── styles/                          # Tailwind config extensions
├── middleware.ts                    # Auth, locale, edge logic
└── env.ts                           # Type-safe env validation (zod)
```

### `apps/api` (NestJS)

```
apps/api/src/
├── modules/
│   ├── auth/
│   │   ├── strategies/              # JWT, refresh, M-Pesa OAuth
│   │   ├── guards/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   └── dto/
│   ├── users/
│   ├── catalog/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── brands/
│   │   └── catalog.module.ts        # Barrel module
│   ├── inventory/
│   ├── cart/
│   ├── orders/
│   ├── payments/
│   │   ├── providers/
│   │   │   ├── mpesa.provider.ts
│   │   │   ├── flutterwave.provider.ts
│   │   │   └── payment.provider.interface.ts
│   │   └── ...
│   ├── search/                      # Typesense facade
│   ├── uploads/                     # S3 presigned URLs, bulk imports
│   ├── suppliers/
│   ├── quotes/
│   ├── analytics/
│   ├── notifications/               # Email, SMS, in-app
│   └── admin/                       # Admin-specific aggregations
├── common/
│   ├── decorators/                  # @CurrentUser, @Roles, @Public
│   ├── guards/                      # JwtGuard, RolesGuard, ThrottleGuard
│   ├── filters/                     # GlobalExceptionFilter
│   ├── interceptors/                # LoggingInterceptor, CacheInterceptor
│   ├── pipes/                       # ZodValidationPipe
│   └── middleware/
├── infrastructure/
│   ├── prisma/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── redis/
│   ├── typesense/
│   ├── s3/
│   ├── queue/                       # BullMQ setup
│   └── observability/               # Pino logger, Sentry, OpenTelemetry
├── config/
│   ├── configuration.ts             # Typed env config
│   └── validation.schema.ts
├── app.module.ts
├── main.ts
└── health.controller.ts             # /health for load balancer
```

### Folder principles that matter

- **Group by feature, not by type.** `modules/orders/` contains its controller, service, DTOs, and tests together. You almost never need to edit just "all the services" — you edit one feature.
- **Barrel exports sparingly.** `index.ts` re-exports kill tree-shaking and cause circular dependencies. Use them at module boundaries only.
- **The `common/` folder is for cross-cutting concerns only.** If it's only used by one module, it lives in that module.
- **`infrastructure/` is for I/O adapters.** Anything that talks to the outside world (DB, Redis, S3, third-party APIs) belongs here, behind an interface.

---

## 3. Scalable Database Schema

### Design principles

- **Soft delete by default** on user-facing entities (`deleted_at`). Hard delete only via admin tooling.
- **UUIDs** (specifically UUIDv7 for sortable IDs) for public-facing IDs. Auto-increment ints only for internal join tables.
- **Money as integers** in the smallest unit (cents). Never floats. `price_cents` with `currency` column.
- **JSONB for flexible specs** (37 categories means specs vary wildly — JSONB beats EAV).
- **Audit columns everywhere**: `created_at`, `updated_at`, `created_by`, `updated_by`.
- **Indexes are not optional.** Every foreign key. Every column used in `WHERE` or `ORDER BY` at scale.

### Core schema (Prisma)

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearchPostgres", "metrics"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ IDENTITY ============

model User {
  id            String    @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  email         String?   @unique
  phone         String?   @unique
  passwordHash  String?
  firstName     String?
  lastName      String?
  role          UserRole  @default(CUSTOMER)
  status        UserStatus @default(ACTIVE)
  emailVerified DateTime?
  phoneVerified DateTime?
  lastLoginAt   DateTime?

  addresses     Address[]
  orders        Order[]
  cart          Cart?
  savedItems    SavedItem[]
  quotes        QuoteRequest[]
  permissions   UserPermission[]
  supplier      Supplier?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  @@index([phone])
  @@index([email])
  @@index([role, status])
}

enum UserRole {
  CUSTOMER
  SUPPLIER
  ADMIN
  SUPER_ADMIN
  WAREHOUSE_STAFF
  FINANCE
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  PENDING_VERIFICATION
}

model UserPermission {
  userId     String @db.Uuid
  permission String        // e.g. "products:write", "orders:refund"
  user       User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, permission])
}

// ============ CATALOG ============

model Category {
  id          String     @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  slug        String     @unique
  name        String
  description String?
  imageUrl    String?
  iconName    String?
  parentId    String?    @db.Uuid
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  // Materialized path for fast tree queries — e.g. "tools/power-tools/drills"
  path        String
  depth       Int        @default(0)
  sortOrder   Int        @default(0)
  isActive    Boolean    @default(true)
  // Schema for product specs in this category — drives admin form generation
  specSchema  Json?

  products    Product[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([parentId])
  @@index([path])
  @@index([slug, isActive])
}

model Brand {
  id       String    @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  slug     String    @unique
  name     String
  logoUrl  String?
  products Product[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Product {
  id              String   @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  slug            String   @unique
  sku             String   @unique
  name            String
  shortDescription String?
  description     String?           @db.Text
  categoryId      String   @db.Uuid
  brandId         String?  @db.Uuid
  // Flexible specs keyed by category specSchema
  specs           Json     @default("{}")
  // Pricing
  priceCents      Int
  compareAtCents  Int?              // For showing discounts
  currency        String   @default("KES") @db.VarChar(3)
  // Status
  status          ProductStatus @default(DRAFT)
  isFeatured      Boolean  @default(false)
  // Logistics
  weightGrams     Int?
  lengthMm        Int?
  widthMm         Int?
  heightMm        Int?
  // SEO
  metaTitle       String?
  metaDescription String?
  // Search rank booster
  popularityScore Float    @default(0)

  category        Category @relation(fields: [categoryId], references: [id])
  brand           Brand?   @relation(fields: [brandId], references: [id])
  variants        ProductVariant[]
  images          ProductImage[]
  inventory       Inventory[]
  reviews         Review[]
  orderItems      OrderItem[]
  cartItems       CartItem[]
  savedBy         SavedItem[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  @@index([categoryId, status])
  @@index([brandId])
  @@index([status, isFeatured])
  @@index([popularityScore(sort: Desc)])
  @@index([priceCents])
  // Full-text search backup (Typesense is primary)
  @@index([name(ops: raw("gin_trgm_ops"))], type: Gin)
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
  OUT_OF_STOCK
}

model ProductVariant {
  id          String  @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  productId   String  @db.Uuid
  sku         String  @unique
  name        String  // e.g. "5kg", "Red - Large"
  // Variant-level overrides
  priceCents  Int?
  attributes  Json    @default("{}")
  product     Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  inventory   Inventory[]

  @@index([productId])
}

model ProductImage {
  id        String  @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  productId String  @db.Uuid
  url       String  // Master URL on S3
  alt       String?
  sortOrder Int     @default(0)
  width     Int?
  height    Int?
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId, sortOrder])
}

// ============ INVENTORY ============

model Warehouse {
  id        String  @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  name      String
  code      String  @unique
  address   String?
  city      String
  latitude  Float?
  longitude Float?
  isActive  Boolean @default(true)
  inventory Inventory[]
}

model Inventory {
  id          String   @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  productId   String   @db.Uuid
  variantId   String?  @db.Uuid
  warehouseId String   @db.Uuid
  quantity    Int      @default(0)
  reserved    Int      @default(0)  // Held by pending orders
  reorderLevel Int     @default(0)
  // Optimistic locking
  version     Int      @default(0)

  product     Product   @relation(fields: [productId], references: [id])
  variant     ProductVariant? @relation(fields: [variantId], references: [id])
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id])

  updatedAt   DateTime  @updatedAt

  @@unique([productId, variantId, warehouseId])
  @@index([warehouseId])
  @@index([quantity])
}

// ============ COMMERCE ============

model Cart {
  id        String     @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  userId    String?    @unique @db.Uuid  // null for guest carts (keyed by session)
  sessionId String?    @unique
  user      User?      @relation(fields: [userId], references: [id])
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  expiresAt DateTime?
}

model CartItem {
  id        String  @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  cartId    String  @db.Uuid
  productId String  @db.Uuid
  variantId String? @db.Uuid
  quantity  Int
  // Snapshot price for stale-cart detection
  priceCentsSnapshot Int

  cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])

  @@unique([cartId, productId, variantId])
}

model Order {
  id              String   @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  orderNumber     String   @unique  // Human-readable: ORD-2026-00012
  userId          String?  @db.Uuid
  status          OrderStatus @default(PENDING_PAYMENT)
  // Pricing
  subtotalCents   Int
  shippingCents   Int
  taxCents        Int
  discountCents   Int      @default(0)
  totalCents      Int
  currency        String   @default("KES") @db.VarChar(3)
  // Shipping
  shippingAddressId String? @db.Uuid
  billingAddressId  String? @db.Uuid
  // Metadata
  notes           String?
  source          OrderSource @default(WEB)

  user            User?     @relation(fields: [userId], references: [id])
  items           OrderItem[]
  payments        Payment[]
  shipments       Shipment[]
  shippingAddress Address?  @relation("ShippingAddress", fields: [shippingAddressId], references: [id])
  billingAddress  Address?  @relation("BillingAddress", fields: [billingAddressId], references: [id])

  placedAt        DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId, createdAt(sort: Desc)])
  @@index([status])
  @@index([orderNumber])
}

enum OrderStatus {
  PENDING_PAYMENT
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum OrderSource {
  WEB
  MOBILE
  ADMIN
  API
}

model OrderItem {
  id          String  @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  orderId     String  @db.Uuid
  productId   String  @db.Uuid
  variantId   String? @db.Uuid
  // Immutable snapshot — products may change after order
  productName String
  sku         String
  quantity    Int
  unitPriceCents Int
  totalCents  Int

  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product @relation(fields: [productId], references: [id])

  @@index([orderId])
}

model Payment {
  id              String   @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  orderId         String   @db.Uuid
  provider        PaymentProvider
  providerRef     String?  // M-Pesa receipt, Flutterwave tx_ref
  amountCents     Int
  currency        String   @db.VarChar(3)
  status          PaymentStatus @default(INITIATED)
  rawPayload      Json?    // Full provider response for audit
  failureReason   String?

  order           Order    @relation(fields: [orderId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([orderId])
  @@index([providerRef])
  @@index([status])
}

enum PaymentProvider {
  MPESA
  FLUTTERWAVE
  PAYSTACK
  CARD
  BANK_TRANSFER
  CASH_ON_DELIVERY
}

enum PaymentStatus {
  INITIATED
  PROCESSING
  SUCCESSFUL
  FAILED
  CANCELLED
  REFUNDED
}

model Shipment {
  id           String   @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  orderId      String   @db.Uuid
  carrier      String?
  trackingCode String?
  status       ShipmentStatus @default(PENDING)
  shippedAt    DateTime?
  deliveredAt  DateTime?
  order        Order    @relation(fields: [orderId], references: [id])
}

enum ShipmentStatus {
  PENDING
  IN_TRANSIT
  DELIVERED
  FAILED_DELIVERY
  RETURNED
}

model Address {
  id          String  @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  userId      String? @db.Uuid
  fullName    String
  phone       String
  line1       String
  line2       String?
  city        String
  region      String?
  postalCode  String?
  country     String  @default("KE")
  latitude    Float?
  longitude   Float?
  isDefault   Boolean @default(false)

  user        User?   @relation(fields: [userId], references: [id])
  ordersShipping Order[] @relation("ShippingAddress")
  ordersBilling  Order[] @relation("BillingAddress")
}

// ============ ENGAGEMENT ============

model SavedItem {
  userId    String  @db.Uuid
  productId String  @db.Uuid
  createdAt DateTime @default(now())

  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@id([userId, productId])
}

model QuoteRequest {
  id          String   @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  userId      String?  @db.Uuid
  contactName String
  contactPhone String
  contactEmail String?
  items       Json     // [{productId, quantity, notes}]
  notes       String?
  status      QuoteStatus @default(PENDING)
  respondedAt DateTime?
  responsePayload Json?

  user        User?    @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status, createdAt])
}

enum QuoteStatus {
  PENDING
  RESPONDED
  ACCEPTED
  EXPIRED
  CANCELLED
}

model Review {
  id        String  @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  productId String  @db.Uuid
  userId    String  @db.Uuid
  rating    Int     // 1-5
  title     String?
  body      String?
  isVerified Boolean @default(false)  // Verified purchase
  product   Product @relation(fields: [productId], references: [id])

  createdAt DateTime @default(now())

  @@unique([productId, userId])
  @@index([productId])
}

// ============ SUPPLIERS ============

model Supplier {
  id           String  @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  userId       String  @unique @db.Uuid
  businessName String
  kraPin       String? // Kenya tax ID
  status       SupplierStatus @default(PENDING_APPROVAL)
  commission   Float   @default(0.10) // 10% platform fee
  user         User    @relation(fields: [userId], references: [id])
  createdAt    DateTime @default(now())
}

enum SupplierStatus {
  PENDING_APPROVAL
  ACTIVE
  SUSPENDED
}

// ============ OBSERVABILITY ============

model AuditLog {
  id        String   @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  actorId   String?  @db.Uuid
  action    String   // "product.update", "order.refund"
  entity    String   // "product", "order"
  entityId  String?  @db.Uuid
  metadata  Json?
  ip        String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([entity, entityId])
  @@index([actorId, createdAt(sort: Desc)])
}
```

### Indexing strategy

Beyond what's declared above, run `EXPLAIN ANALYZE` on every query that hits a list endpoint. The non-obvious indexes to add early:

- `Product (categoryId, status, popularityScore DESC)` — category listings sorted by popularity
- `Order (userId, createdAt DESC)` — user's order history
- `Inventory (productId, warehouseId) INCLUDE (quantity, reserved)` — covering index for stock checks
- Partial indexes for hot subsets: `WHERE status = 'ACTIVE'` on Product

### Migrations discipline

- One migration per logical change. Never edit a migration that's been deployed.
- Always test migrations on a copy of prod before running them.
- Schema changes that lock tables (adding columns with defaults, changing types) require a multi-step expand/contract pattern at scale.

---

## 4. Admin Dashboard Architecture

The admin dashboard is its own application surface, not an afterthought bolted onto the storefront. Treat it that way.

### Structure

```
apps/web/src/app/admin/
├── layout.tsx                    # Sidebar shell, auth guard, RBAC
├── dashboard/
│   └── page.tsx                  # KPI cards, charts, activity feed
├── products/
│   ├── page.tsx                  # Paginated table with bulk actions
│   ├── new/page.tsx
│   ├── [id]/
│   │   ├── page.tsx              # Edit form
│   │   ├── images/page.tsx
│   │   └── inventory/page.tsx
│   └── bulk-edit/page.tsx        # Multi-select → spreadsheet-style editor
├── categories/
│   ├── page.tsx                  # Tree view with drag-reorder
│   └── [id]/page.tsx
├── orders/
│   ├── page.tsx
│   └── [id]/page.tsx             # Full order detail with timeline
├── inventory/
│   ├── page.tsx                  # Stock levels across warehouses
│   └── adjustments/page.tsx      # Stock takes, transfers
├── customers/
├── suppliers/
├── uploads/
│   ├── products/page.tsx         # CSV/Excel import wizard
│   └── inventory/page.tsx
├── analytics/
│   ├── revenue/page.tsx
│   ├── products/page.tsx
│   └── customers/page.tsx
└── settings/
    ├── team/page.tsx             # Users + permissions
    ├── general/page.tsx
    └── integrations/page.tsx
```

### Key architectural patterns

**Server Components for data, Client Components for interaction.** Lists, charts, and tables fetch on the server. Forms, modals, and filters are client. This keeps the JS bundle small even as the admin grows.

**Optimistic UI everywhere.** When an admin toggles a product to active, update the UI immediately. Roll back if the API fails. This is what makes an admin feel "fast."

**Bulk operations as queued jobs.** A 4,000-row CSV upload cannot run in a request-response cycle. Pattern:
1. Upload CSV to S3 via presigned URL
2. POST `/api/admin/imports` with the S3 key
3. API creates an `Import` record (status: queued) and enqueues a BullMQ job
4. Worker streams the CSV, validates rows, upserts in batches of 500, writes per-row results back to `Import.results`
5. UI polls `/api/admin/imports/:id` or subscribes via SSE for live progress
6. Admin can download a results file (success + failure rows with errors)

**Bulk edit pattern.** Select N rows in a table → "Edit selected" → modal with field-level toggles ("Update price" + new value, "Update status" + new value) → preview of changes → confirm → API receives `{ ids: [...], updates: {...} }` → applies in transaction → invalidates caches.

**Saved views and filters.** Power users want to save "low stock in Nairobi warehouse" as a one-click view. Store these per-user in a `SavedView` table.

**Action audit trail.** Every state-changing admin action writes to `AuditLog`. The admin UI exposes a "history" tab on every entity showing who changed what, when, from what IP.

### Admin-specific tech choices

- **TanStack Table** for data grids (sorting, filtering, virtualization, column resizing).
- **react-hook-form + Zod** for forms with deeply nested data (product specs).
- **Recharts or Tremor** for charts. Tremor was built for dashboards and pairs beautifully with Tailwind.
- **Command palette** (cmd+k) — search across products, orders, customers. Trivial to add with `cmdk`. Power users live in it.

### RBAC implementation

Don't hardcode roles into UI. Permissions flow:

1. `User.role` is a coarse classification.
2. `UserPermission` rows define fine-grained capabilities (`products:write`, `orders:refund`, `users:impersonate`).
3. Backend guards check permissions per route.
4. Frontend receives the user's permissions in their session and renders/hides UI accordingly.
5. A `<Can permission="orders:refund">...</Can>` component wraps gated UI.

This lets you create custom roles ("Junior catalog editor: can write products but not delete, can read orders") without code changes.

---

## 5. Search Architecture

### Why Typesense, not Elasticsearch or just Postgres

Postgres full-text is fine until you need: typo tolerance, faceted filtering with counts, sub-100ms multi-field ranking, and synonyms. Then you're rebuilding Elasticsearch poorly. Typesense gives you all of that with one binary, no JVM, and a 10-line config. For 4k–100k products it's overkill in the best way — you'll be on a single $20/month node for years.

### Index design

One collection: `products`. Schema:

```ts
{
  name: 'products',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'name', type: 'string', infix: true },              // for partial matches
    { name: 'description', type: 'string', optional: true },
    { name: 'sku', type: 'string', infix: true },
    { name: 'brand', type: 'string', facet: true, optional: true },
    { name: 'category_id', type: 'string', facet: true },
    { name: 'category_path', type: 'string[]', facet: true },   // ['tools', 'tools/power-tools', 'tools/power-tools/drills']
    { name: 'price_cents', type: 'int32', facet: true },
    { name: 'status', type: 'string', facet: true },
    { name: 'in_stock', type: 'bool', facet: true },
    { name: 'attributes', type: 'object', facet: true },        // Flattened specs
    { name: 'image_url', type: 'string', optional: true, index: false },
    { name: 'slug', type: 'string', index: false },
    { name: 'popularity', type: 'float' },
    { name: 'created_at', type: 'int64' },
  ],
  default_sorting_field: 'popularity',
  token_separators: ['-', '_', '/'],                            // "DCD771C2" matches "DCD-771-C2"
  enable_nested_fields: true,
}
```

The `category_path` array trick lets a search for "drills" with filter `category_path:=tools/power-tools` work, AND lets you facet on each level of the tree.

### Sync from Postgres to Typesense

**Pattern: transactional outbox.** Don't write to Typesense directly from your services — you'll get partial failures and drift.

1. Any mutation on `Product` writes a row to an `OutboxEvent` table in the same transaction.
2. A worker polls `OutboxEvent` (or listens on Postgres `LISTEN/NOTIFY`) and dispatches to Typesense.
3. On success, the row is marked processed.
4. Failures retry with exponential backoff.

This gives you exactly-once semantics in practice and makes the search index eventually consistent without ever drifting permanently.

For initial seed and disaster recovery: a `npm run search:reindex` command that batches all active products to Typesense in parallel.

### Query patterns

**Instant search (header bar)** — debounced 150ms, hit `/api/search/suggest?q=...` which fronts Typesense with a Redis cache (60s TTL) for the top 1000 queries. Returns 8 products + 3 categories + 3 brands.

**Listing page search** — full query with filters, facets, sort, pagination. The result includes facet counts so the sidebar can show "Power Tools (243), Hand Tools (89)" dynamically.

**Synonyms** — maintain a synonym list in the admin: `["drill", "auger", "borer"]`. Hardware terminology varies a lot in East African markets — locals will search "spanner" not "wrench," "torch" not "flashlight."

**Ranking tuning** — `popularity` is computed nightly by a worker: a weighted blend of views (last 30d), add-to-carts, purchases, and conversion rate. This is what turns "search that works" into "search that sells."

---

## 6. Caching Strategy

Caching is layered. Each layer absorbs a class of load. Get this right and your $50/month database serves 100k users.

### Layer 1: CDN edge (Cloudflare)

- Public product pages, category pages, homepage → cached at edge with 60s TTL + stale-while-revalidate of 24h.
- Images, JS, CSS, fonts → 1 year immutable (hashed filenames).
- Purge on content change via webhook from the API.

### Layer 2: Next.js Data Cache + Full Route Cache

- RSC fetches use `fetch(url, { next: { revalidate: 60, tags: ['products'] } })`.
- On mutation, call `revalidateTag('products')` from a route handler hit by an API webhook.
- For dynamic but cacheable pages (product detail), use `generateStaticParams` for the top 500 SKUs by traffic + ISR for the long tail.

### Layer 3: Application cache (Redis)

| Key pattern | TTL | Purpose |
|---|---|---|
| `product:{id}` | 5 min | Single product reads from product page |
| `product:slug:{slug}` | 5 min | Slug → ID lookup |
| `category:tree` | 30 min | Full category tree for nav |
| `category:{id}:products:page:{n}` | 60s | First few pages of category listings |
| `search:suggest:{queryHash}` | 60s | Autocomplete results |
| `cart:{userId}` | session | Active cart (read-through) |
| `inventory:{productId}:summary` | 30s | Aggregated stock across warehouses |
| `homepage:hero` | 5 min | Curated homepage content |
| `user:{id}:permissions` | 10 min | RBAC checks on every request |
| `rate-limit:{ip}:{route}` | 1 min | Per-IP throttling |

**Invalidation rule:** any service that writes the underlying entity is responsible for publishing a cache-invalidation event to a Redis pub/sub channel. Consumers (Next.js, API instances) subscribe and evict.

### Layer 4: HTTP cache headers

- API responses for public data: `Cache-Control: public, max-age=60, stale-while-revalidate=600`.
- Authenticated responses: `Cache-Control: private, no-store`.
- Use `ETag` on heavy endpoints (product detail) for `304 Not Modified` responses.

### Layer 5: Database query cache

Prisma doesn't cache, but you can put a thin wrapper:

```ts
async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = await redis.get(key)
  if (hit) return JSON.parse(hit)
  const fresh = await fn()
  await redis.set(key, JSON.stringify(fresh), 'EX', ttl)
  return fresh
}
```

Use this for hot reads. **Do not cache writes or auth-sensitive queries.**

### What NOT to cache

- User-specific data with short visit horizons (a single user's order history rarely needs caching).
- Anything inventory-critical without a very short TTL — overselling kills trust.
- Sensitive data even if it would be a hit.

---

## 7. Image Optimization Strategy

Images are 70%+ of page weight on e-commerce. On African mobile data, this is the single biggest UX lever you have.

### Pipeline

```
Admin upload
    │
    ▼
Presigned PUT to S3 (raw bucket)
    │
    ▼
S3 → Lambda trigger (or SQS → worker)
    │
    ├─→ Sharp/libvips processes
    │     • Strips EXIF
    │     • Generates: 200, 400, 800, 1200, 1600px wide
    │     • Formats: AVIF, WebP, JPEG fallback
    │     • Smart compression (quality 80, mozjpeg)
    │
    ▼
S3 (public CDN bucket) under /products/{id}/{size}.{format}
    │
    ▼
CloudFront serves with Cache-Control: public, max-age=31536000, immutable
    │
    ▼
next/image picks format per browser + size per viewport
```

### Frontend rules

- **Always** use `next/image` with explicit `width` and `height` — prevents CLS.
- **Above-the-fold images** get `priority` (eager + high fetchpriority).
- **Everything else** is lazy with `loading="lazy"`.
- **`sizes` attribute is mandatory**: `sizes="(max-width: 768px) 50vw, 25vw"` — tells the browser which density to fetch.
- **Blur placeholder** for product images using `placeholder="blur"` with a 10x10 base64 thumb stored on the Product record.

### S3 layout

```
hardware-marketplace-images/
├── original/
│   └── products/{productId}/{imageId}.jpg     # Master, never served
├── processed/
│   └── products/{productId}/{imageId}/
│       ├── 200.avif    200.webp    200.jpg
│       ├── 400.avif    400.webp    400.jpg
│       ├── 800.avif    800.webp    800.jpg
│       └── 1600.avif   1600.webp   1600.jpg
└── tmp/                                        # Uploads-in-progress, lifecycle rule deletes after 24h
```

### Cost optimization

- Use **Cloudflare Images** instead of building this yourself if you want to ship faster. Flat $5/100k images stored + $1/100k delivered. Hands off.
- If self-hosting: S3 Intelligent-Tiering on the `original/` prefix — keeps raw files cheap as access decays.
- Lifecycle rule: move `processed/` to S3 IA after 90 days of no access.

---

## 8. Deployment Strategy

### Environments

- **Local** — Docker Compose with Postgres, Redis, Typesense, MinIO (S3 mock).
- **Preview** — every PR gets a Vercel preview (web) + an ephemeral API via Render preview environments.
- **Staging** — mirrors prod, seeded with anonymized prod data. M-Pesa sandbox.
- **Production** — multi-AZ, monitored, alerted.

### Recommended cloud topology (Render + AWS hybrid for speed)

Start cheap, scale into AWS as load and team grow.

**Phase 1: MVP (sub-$200/month)**
- Next.js → Vercel (or Render Web Service)
- NestJS → Render Web Service (1 instance, 1GB RAM)
- Workers → Render Background Worker
- Postgres → Neon or Render Postgres (autoscaling)
- Redis → Upstash (serverless, pay-per-request)
- Typesense → Typesense Cloud or a single $20 droplet
- S3 + Cloudflare CDN → AWS + free Cloudflare tier

**Phase 2: Scale ($500–$2000/month)**
- Next.js → Vercel Pro or self-hosted on AWS ECS Fargate behind ALB
- NestJS → AWS ECS Fargate, 2-4 instances behind ALB with health checks
- Workers → ECS Fargate (separate task definition, can scale independently)
- Postgres → AWS RDS Multi-AZ with one read replica
- Redis → AWS ElastiCache or Upstash Pro
- Typesense → 2-node cluster on EC2 or Typesense Cloud Production
- S3 + CloudFront

**Phase 3: Enterprise**
- Multi-region (Kenya primary, secondary for DR)
- Read replicas per region
- Aurora Postgres
- Kubernetes (EKS) if team is large enough to justify

### CI/CD with GitHub Actions

```yaml
# .github/workflows/ci.yml — runs on every PR
- Install (pnpm, cached)
- Lint (eslint, typecheck)
- Unit tests (vitest)
- Build apps
- Run Prisma migrate against test DB
- Integration tests
- E2E (Playwright against preview deployment)

# .github/workflows/deploy.yml — runs on merge to main
- Build Docker images
- Push to ECR
- Run migrations (with --create-only first to review, manual approve for prod)
- Deploy API (rolling update, 50% at a time)
- Smoke tests
- Deploy web
- Invalidate CDN
- Notify Slack
```

### Migration strategy in production

1. Migrations run **before** new code is deployed.
2. Every migration must be backward-compatible with the previous code version (zero-downtime).
3. Destructive changes (drop column) happen as a two-deploy sequence: stop writing → deploy → drop in next release.
4. Always have a backup taken automatically before migration.

### Observability stack

- **Logs** → Pino (structured JSON) → CloudWatch or Better Stack
- **Metrics** → OpenTelemetry → Grafana Cloud or Datadog
- **Errors** → Sentry on both web and API
- **Uptime** → Better Stack pings
- **Real user monitoring** → Vercel Analytics or PostHog

Set up alerts for: error rate > 1%, p95 latency > 500ms, queue depth > 100, M-Pesa callback failures, DB connection pool exhaustion.

---

## 9. Security Best Practices

### Authentication

- **JWT with refresh rotation.** Access tokens 15 min, refresh tokens 30 days, stored as HttpOnly Secure SameSite=Lax cookies. Refresh token rotation on every use — detect reuse and invalidate the family.
- **Argon2id** for password hashing (not bcrypt; argon2id is the current standard).
- **Phone-first auth for customers.** OTP via Africa's Talking SMS API. Email optional.
- **Rate limit auth endpoints aggressively** — 5 attempts per IP per 15 min on login, OTP requests.
- **Mandatory 2FA for admin roles.** TOTP (authenticator app) preferred; SMS OTP as fallback.

### Authorization

- Every API endpoint declares required permissions via `@RequirePermissions('products:write')`.
- A `RolesGuard` runs on every request after `JwtGuard`, denying if the user's permission set doesn't include the required.
- Frontend mirrors this — never trust client-side checks alone; the API is the source of truth.
- For supplier-scoped resources, additional ownership checks: a supplier can only edit their own products.

### Input validation

- **Zod schemas** for all DTOs, in a shared package between web and api.
- NestJS `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true` — unknown fields are rejected, not silently ignored.
- File uploads: validate magic bytes (not just MIME headers), enforce max size per file type, scan with ClamAV for any user-generated content.

### Common vuln coverage

| Threat | Mitigation |
|---|---|
| SQL injection | Prisma parameterizes; never use `$queryRawUnsafe` with user input |
| XSS | React escapes by default; CSP header restricting inline scripts |
| CSRF | SameSite=Lax cookies + Origin header check on mutating routes |
| Clickjacking | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` |
| MIME sniffing | `X-Content-Type-Options: nosniff` |
| Open redirect | Allowlist redirect targets, validate before redirecting |
| Mass assignment | Whitelist fields in DTOs; never spread `req.body` into Prisma |
| IDOR | Always check ownership in the query (`WHERE id = ? AND userId = ?`) |
| Replay attacks (M-Pesa webhook) | Verify signature, check timestamp window, idempotency key on payment ID |

### Secrets management

- Local: `.env.local` (gitignored, has `.env.example` template).
- Production: AWS Secrets Manager, injected into containers at runtime. **Never** in env vars of the deploy config.
- Rotation: DB passwords and API keys rotated quarterly with automation.

### Rate limiting + bot protection

- Per-IP and per-user rate limits via Redis on every public endpoint.
- Stricter limits on search and add-to-cart (target of scrapers).
- Cloudflare Bot Fight Mode + Turnstile (free) on signup/login/checkout.

### Compliance considerations

- **Kenya Data Protection Act (2019)** — register as a data controller, publish a privacy policy, allow users to export/delete their data.
- **PCI scope minimization** — never touch raw card numbers. M-Pesa and any future card processor handle PAN; you store only payment provider tokens.
- **Audit log retention**: 7 years for financial events, in append-only storage.

---

## 10. UI/UX Design System

This is what separates "another e-commerce site" from a brand people trust with their money. Dewmix Hardware's identity is **blue and white** — disciplined, trustworthy, engineered. Like the brand promises: solid materials, no surprises.

### Brand identity

- **Primary:** Confident blue. Used for CTAs, links, active states, brand surfaces.
- **Surface:** White (light mode) / near-black slate (dark mode). The blue should breathe — never crowd it with color.
- **Neutrals:** Cool slate scale. Pairs naturally with blue; reads as "engineered" not "earthy."
- **Accents only for status:** success green, warning amber, danger red. Never as decoration.

The rule: **90% of any screen is white/slate and ink. Blue is a punctuation mark.** Hardware buyers are making considered purchases — a calm, confident UI converts better than a loud one.

### Design tokens — ShadCN-compatible CSS variables

Use HSL CSS variables so dark mode is a class swap, not a rebuild. This is also how ShadCN's primitives expect to be themed — adopt this on day one and every component you add inherits the theme for free.

```css
/* apps/web/src/styles/globals.css */

@layer base {
  :root {
    /* Surface */
    --background: 0 0% 100%;              /* white */
    --foreground: 222 47% 11%;            /* slate-900 */
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;

    /* Brand — Dewmix blue */
    --primary: 217 91% 50%;               /* blue-600 */
    --primary-foreground: 0 0% 100%;

    /* Neutrals */
    --secondary: 210 40% 96%;             /* slate-100 */
    --secondary-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;      /* slate-500 */
    --accent: 214 95% 93%;                /* blue-100 — subtle hover surfaces */
    --accent-foreground: 222 47% 11%;

    /* Status */
    --success: 142 71% 45%;
    --warning: 38 92% 50%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;

    /* Lines */
    --border: 214 32% 91%;                /* slate-200 */
    --input: 214 32% 91%;
    --ring: 217 91% 50%;                  /* matches primary for focus rings */

    --radius: 0.5rem;
  }

  .dark {
    /* Surface — near-black with cool slate undertone, not pure #000 */
    --background: 222 47% 6%;
    --foreground: 210 40% 98%;
    --card: 222 47% 9%;
    --card-foreground: 210 40% 98%;
    --popover: 222 47% 9%;
    --popover-foreground: 210 40% 98%;

    /* Brand — slightly lighter blue lifts off dark surfaces cleanly */
    --primary: 217 91% 60%;
    --primary-foreground: 222 47% 11%;

    /* Neutrals */
    --secondary: 217 32% 14%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 32% 14%;
    --muted-foreground: 215 20% 65%;
    --accent: 217 91% 20%;                /* deep blue accent for hover */
    --accent-foreground: 210 40% 98%;

    /* Status */
    --success: 142 71% 50%;
    --warning: 38 92% 55%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 210 40% 98%;

    /* Lines — visible but not loud */
    --border: 217 32% 18%;
    --input: 217 32% 18%;
    --ring: 217 91% 60%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground antialiased; }
}
```

```ts
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card:        { DEFAULT: 'hsl(var(--card))',        foreground: 'hsl(var(--card-foreground))' },
        popover:     { DEFAULT: 'hsl(var(--popover))',     foreground: 'hsl(var(--popover-foreground))' },
        primary:     { DEFAULT: 'hsl(var(--primary))',     foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))',   foreground: 'hsl(var(--secondary-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))',       foreground: 'hsl(var(--muted-foreground))' },
        accent:      { DEFAULT: 'hsl(var(--accent))',      foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        border:  'hsl(var(--border))',
        input:   'hsl(var(--input))',
        ring:    'hsl(var(--ring))',
        // Direct blue scale for explicit utilities (gradients, badges, etc.)
        blue: {
          50:'#eff6ff', 100:'#dbeafe', 200:'#bfdbfe', 300:'#93c5fd',
          400:'#60a5fa', 500:'#3b82f6', 600:'#2563eb', 700:'#1d4ed8',
          800:'#1e40af', 900:'#1e3a8a', 950:'#172554',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans:    ['Inter Variable', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Inter Variable', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-1': ['clamp(2.5rem, 5vw, 4rem)',    { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-2': ['clamp(2rem, 4vw, 3rem)',      { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        'h1':        ['clamp(1.75rem, 3vw, 2.25rem)',{ lineHeight: '1.2',  letterSpacing: '-0.01em' }],
        'h2':        ['1.5rem',  { lineHeight: '1.3' }],
        'h3':        ['1.25rem', { lineHeight: '1.4' }],
        'body-lg':   ['1.125rem',{ lineHeight: '1.6' }],
        'body':      ['1rem',    { lineHeight: '1.6' }],
        'body-sm':   ['0.875rem',{ lineHeight: '1.5' }],
        'caption':   ['0.75rem', { lineHeight: '1.4' }],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.06)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1),  0 8px 10px -6px rgb(0 0 0 / 0.06)',
      },
      transitionTimingFunction: {
        'out-expo':    'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

### Dark mode implementation

Use **next-themes** with a system-aware default. Persist user choice.

```bash
pnpm add next-themes
```

```tsx
// apps/web/src/app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

```tsx
// apps/web/src/components/theme-provider.tsx
'use client'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />
}
```

```tsx
// apps/web/src/components/theme-toggle.tsx
'use client'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          <Sun  className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}><Sun     className="mr-2 h-4 w-4" /> Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}><Moon    className="mr-2 h-4 w-4" /> Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}><Monitor className="mr-2 h-4 w-4" /> System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Critical details:**
- `suppressHydrationWarning` on `<html>` prevents a flash of unthemed content (FOUC).
- `disableTransitionOnChange` stops every element from animating during the swap — without this, the toggle looks broken.
- The toggle lives in the header — top-right next to the cart icon. On mobile, inside the hamburger menu.
- Default to `system` so users in dark-mode-by-default environments aren't slapped with white at 11 PM.

### Surface application guide

| Surface | Light | Dark |
|---|---|---|
| Page background | Pure white | `slate-950` (near-black, cool undertone) |
| Cards / modals | White with `border-slate-200` | `slate-900` with `border-slate-800` |
| Primary CTA | `bg-blue-600` `text-white` | `bg-blue-500` `text-slate-900` |
| Body text | `text-slate-900` | `text-slate-50` |
| Muted text | `text-slate-500` | `text-slate-400` |
| Hover surface | `hover:bg-blue-50` | `hover:bg-blue-950/40` |
| Hero / brand panels | Optional `bg-blue-600` with white text | Same `bg-blue-600` — works in both modes |
| Inputs | White, `border-slate-200`, focus ring blue | `bg-slate-900`, `border-slate-800`, focus ring blue |
| Skeleton shimmer | `bg-slate-100` → `bg-slate-200` | `bg-slate-800` → `bg-slate-700` |

Test every screen in both modes. The most common dark-mode bug: forgetting border colors. A `border-slate-200` card disappears in dark mode if you don't use the `--border` variable.

### Component principles

- **One source of truth per primitive.** ShadCN-style — copy components into `components/ui/`, modify them, own them. Surface library updates never break your design.
- **Composition over configuration.** A `<ProductCard>` is composed of `<Card>`, `<Image>`, `<Price>`, `<Button>`. Each piece is reusable.
- **Variants via `cva` (class-variance-authority).** Type-safe, no className spaghetti.
- **Always use semantic tokens, never hardcoded colors.** `bg-background` not `bg-white`. `text-foreground` not `text-slate-900`. This is what makes dark mode free.
- **Skeleton states for every async surface.** Not spinners — skeletons that match the final layout, using `bg-muted` so they theme correctly.
- **Loading, empty, error states are first-class.** Every list view designs all four states before shipping.

### Motion system

- Page transitions: 200ms `ease-out-expo`.
- Modal/drawer entrances: 250ms with subtle scale (0.95 → 1) + fade.
- Button presses: 100ms transform scale (1 → 0.98 → 1).
- Skeleton shimmer: 1.5s linear gradient sweep using muted token colors.
- Theme switch: instant (no transition — flickering during swap looks broken).
- **Respect `prefers-reduced-motion`** — disable all non-essential motion.

### Mobile-first execution rules

- Design at 360px width first, expand up.
- Tap targets minimum 44×44px.
- Sticky bottom bar on product page with price + "Add to cart" — always visible.
- Header collapses on scroll down, reveals on scroll up.
- Drawer-style filters, not desktop-style sidebars, on mobile.
- Bottom sheet for cart on mobile, not full page.
- WhatsApp floating button (`0787151516`) bottom-right, above the sticky add-to-cart bar. Direct link: `https://wa.me/254787151516`.

### Premium feel checklist

Things that make it feel expensive without costing engineering time:

- Generous whitespace, especially around the blue — let it breathe.
- One font weight per heading level. Mixing 600 and 700 looks amateur.
- Numbers in tabular-nums (`font-variant-numeric: tabular-nums`) on prices.
- Always animate state changes, never just snap.
- Hover states on every interactive element — including subtle ones on cards.
- Active/focus rings use `--ring` (Dewmix blue), not browser default.
- Iconography from **Lucide only** (already a ShadCN dep — never mix libraries).
- Real product photography on the homepage, never stock illustrations.
- **Dark mode is not an afterthought.** Every component is reviewed in both modes before merge — make it part of the PR checklist.

---

## 11. Performance Optimization Plan

Performance is not a phase. It's a habit enforced by CI and budgets.

### Performance budget (enforce in CI with Lighthouse CI)

| Metric | Target | Hard fail |
|---|---|---|
| LCP (mobile, 3G) | < 2.5s | > 4s |
| INP | < 200ms | > 500ms |
| CLS | < 0.1 | > 0.25 |
| TTFB | < 600ms | > 1.5s |
| JS bundle (route) | < 100kb gzipped | > 200kb |
| Image weight per page | < 500kb | > 1.5mb |

### Frontend optimizations

- **RSC by default.** Mark a component `'use client'` only when it needs state, effects, or browser APIs.
- **Streaming with `<Suspense>`** around slower data fetches so the rest of the page renders immediately.
- **Route prefetching** — `<Link prefetch>` on product cards in listing → instant detail page navigation.
- **Code split aggressively.** Admin code never ships to storefront. Heavy components (charts, rich editors) dynamic-import.
- **Font strategy:** Variable fonts via `next/font`, subset to Latin, `font-display: swap`.
- **Third-party scripts via `next/script`** with `strategy="lazyOnload"` — analytics, chat widgets never block render.
- **Avoid layout shift:** every image and embed gets explicit dimensions. Skeletons match final size.
- **Service Worker for offline cart** (later — once PWA matters).

### Backend optimizations

- **Connection pooling** — Prisma + PgBouncer in transaction mode for serverless, session mode for long-running.
- **Avoid N+1** — use `include` carefully or DataLoader pattern for batched fetches.
- **Pagination always** — never return unbounded lists. Cursor-based for infinite scroll, offset for admin tables.
- **Select only what you need** — Prisma `select` clauses; don't ship the description when listing.
- **Database read replicas** — route GET endpoints to replica, writes to primary.
- **Compress responses** — gzip/brotli at the edge.

### Database optimizations

- `EXPLAIN ANALYZE` is part of code review for any new query that touches a list endpoint.
- Use partial indexes for hot subsets.
- Materialized views for expensive analytics queries, refreshed nightly.
- VACUUM and ANALYZE scheduled.
- Slow query log alerted on (queries > 200ms).

### Monitoring loop

1. RUM data flows in continuously (Vercel Analytics or PostHog).
2. Weekly review: which routes regressed, which got slower?
3. Quarterly: lighthouse audits against competitors.
4. Budget enforcement: PR fails CI if Lighthouse drops below threshold.

---

## 12. Roadmap: MVP → Enterprise

### Phase 0 — Foundations (Weeks 1-2)
*Goal: nothing is built yet, but the path is clear.*

- Monorepo scaffolded (Turborepo, pnpm).
- Prisma schema v1 reviewed.
- Design system tokens in Tailwind config.
- ShadCN primitives copied in.
- CI pipelines (lint, typecheck, test, build).
- Local Docker Compose works end-to-end.
- Staging environment provisioned.

### Phase 1 — MVP (Weeks 3-12)
*Goal: live storefront in Kenya with real payments. 50 paying customers.*

**Customer-facing:**
- Homepage with featured products + categories
- Category browsing (37 categories)
- Product listing with price/brand/in-stock filters
- Product detail with images, specs, related products
- Instant search via Typesense
- Guest cart + checkout
- M-Pesa STK push checkout
- SMS order confirmations
- Order tracking by phone number

**Admin:**
- Product CRUD (manual creation)
- CSV bulk upload (4000 SKU seed)
- Inventory levels (single warehouse)
- Order list + detail
- Basic dashboard (today's orders, revenue, low stock)

**Out of scope:**
- Accounts (use phone-based magic OTP only for orders)
- Reviews
- Suppliers (you're the only seller)
- Wishlists
- Quote requests

### Phase 2 — Growth (Months 4-6)
*Goal: 500 paying customers, retention loops, B2B signal.*

- Customer accounts + order history
- Saved items
- Quote requests for bulk buyers
- Reviews + ratings
- Promo codes
- Email marketing (transactional + campaigns)
- WhatsApp Business integration for support
- Improved analytics: cohort retention, RFM segments
- Mobile-optimized PWA install prompt

### Phase 3 — Marketplace (Months 7-12)
*Goal: open to third-party suppliers. Listing fee + commission revenue.*

- Supplier onboarding flow + KYC
- Supplier dashboard (products, orders, payouts)
- Commission engine + payout scheduling
- Multi-warehouse inventory
- Multi-supplier order splitting
- Logistics integrations (Sendy, G4S, Posta Kenya)
- Returns + refunds workflow
- Fraud scoring on checkout

### Phase 4 — Intelligence (Year 2)
*Goal: AI-driven differentiation. Construction estimation as moat.*

- Personalized recommendations (collaborative filtering at first, embeddings later)
- Search ranking with learning-to-rank signals
- Demand forecasting per SKU per warehouse
- **Construction estimator** — user describes a project ("100sqm 3-bedroom house, finishing stage") → BOQ generated → one-click cart
- Visual search (upload a photo of the tool you need)
- Customer support copilot trained on product specs + past tickets

### Phase 5 — Enterprise (Year 2-3)
*Goal: regional expansion. B2B portal. Financing.*

- Multi-currency (KES, UGX, TZS, NGN, ZAR)
- Multi-country tax/shipping rules
- B2B portal with quotes, POs, net-30 terms, dedicated reps
- Embedded financing (BNPL partnerships)
- Open API for SI partners
- Warehouse management system (picking, packing, route optimization)

### Phase 6 — Ecosystem (Year 3+)
- Contractor marketplace (find a fundi)
- Equipment rentals
- White-label for hardware chains
- Logistics-as-a-service for other commerce players

---

## 13. AI-Assisted Coding Workflow with Claude

Claude Opus is leverage. Used well, a 3-engineer team ships like 10. Used badly, you ship slop. Here's the discipline.

### Setup

**Project knowledge base** — drop `ARCHITECTURE.md` (this file), `schema.prisma`, and `package.json` into a Claude Project. Every conversation starts grounded in your actual stack.

**`CLAUDE.md` at repo root** — the project's constitution for Claude Code. Include:
```
- Stack: Next.js App Router, NestJS, Prisma, Tailwind, ShadCN, Typesense, Redis, PostgreSQL.
- Money is always stored as integer cents.
- IDs are UUIDv7.
- All API endpoints validate with Zod schemas from packages/types.
- Server Components by default. Add 'use client' only when necessary.
- Tests: Vitest unit, Playwright E2E. Every new endpoint needs an integration test.
- Commit style: conventional commits.
- Run `pnpm lint && pnpm typecheck` before suggesting any commit.
```

This file is read by Claude Code on every session. It eliminates the "rewrite the conventions in every prompt" tax.

### Daily workflow patterns

**Planning mode for any non-trivial feature.** Before writing a line of code:
1. Describe the feature and acceptance criteria.
2. Ask Claude for an implementation plan: which files, what changes, what's the migration path, what tests.
3. Critique the plan together — does it match the architecture? Any module boundaries violated?
4. Only then start coding.

**Module-by-module implementation.** Build one NestJS module at a time end-to-end (schema → service → controller → tests → frontend integration). Don't half-build five modules.

**Test-first for business logic.** Especially for pricing, inventory reservation, payments. Write the test, then ask Claude to make it pass. Claude is excellent at this and it catches edge cases you'd miss.

**Refactor with the agent on a leash.** When asking for a refactor, scope it: "Refactor `ProductService.findMany` to use the new filter DTO. Do not change behavior. Do not touch other methods." Specificity prevents drift.

**Code review with Claude before PR.** Paste the diff. Ask: "What are the 3 most likely bugs here? What's missing in tests? What edge cases haven't I considered?" It's a free reviewer that never gets tired.

### Multi-agent patterns (as you scale)

- **One Claude session per module/PR** — keeps context tight.
- **A long-running "architect" session** in the Project for cross-cutting decisions.
- **Claude Code for terminal-driven tasks** (writing migrations, running scripts, generating boilerplate).
- **Anthropic API in production** for the customer support copilot, construction estimator, and recommendation explanations.

### Anti-patterns to avoid

- Don't ask for "the whole feature" in one shot. You'll get plausible-looking code that ignores half your conventions.
- Don't accept code you can't explain. Every line in production must be one you understand.
- Don't let Claude invent libraries. If it imports something unfamiliar, verify it exists and is maintained.
- Don't skip the typecheck step. The biggest risk with LLM-assisted code is silent type drift.
- Don't use AI for security-critical code without expert review. Auth, payments, RBAC — review every line manually.

### Productivity multipliers

- **Boilerplate generation:** NestJS modules, Prisma migrations, ShadCN-styled components — instant.
- **Test generation:** "Generate Vitest unit tests for this service. Cover happy path, validation failures, and the 3 most likely edge cases." Save hours.
- **Schema explanations:** Onboard new devs by having Claude walk them through `schema.prisma` interactively.
- **Documentation:** API docs, ADRs (architecture decision records), runbooks. Claude is excellent at all three.
- **Debugging:** Paste a stack trace + relevant code + Claude is faster than Stack Overflow.
- **Migration scripts:** Tedious data migrations — Claude writes the SQL, you review and run on staging first.

### Quality gate before merging anything AI-assisted

1. Did I read every line?
2. Does it match `ARCHITECTURE.md` patterns?
3. Does typecheck pass?
4. Do tests cover the new logic?
5. Did I run it locally end-to-end?
6. Is there an audit log for any state change?

If all six are yes, ship it.

---

## Appendix: Critical decisions to make on day one

These are the choices that hurt to change later. Make them deliberately:

| Decision | Recommendation | Reversibility |
|---|---|---|
| Primary key type | UUIDv7 | Painful to reverse |
| Money representation | Integer cents + currency code | Very painful to reverse |
| Multi-tenant model | Single-tenant per country | Easier early |
| Catalog spec model | JSONB with per-category schemas | Easy to extend |
| Search engine | Typesense | Moderate to swap |
| Payment abstraction | Provider-agnostic interface | Easy if done now |
| Auth | Phone-first OTP, email secondary | Hard to flip later |
| Frontend rendering | RSC + selective client | Easy to evolve |
| Monorepo vs polyrepo | Monorepo (Turborepo) | Painful to merge later |

---

*End of blueprint. This document is versioned. Update it when architecture decisions change — and ask Claude to keep the codebase aligned with it.*
