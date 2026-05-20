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
