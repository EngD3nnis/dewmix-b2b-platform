import {
  Body,
  Controller,
  Get,
  HttpCode,
  Module,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { createHash } from 'node:crypto'
import type { Request } from 'express'

import {
  CreateProductEventSchema,
  type CreateProductEventDto,
  TopInquiredQuerySchema,
  type TopInquiredQuery,
} from '@dewmix/types'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { Public, Roles } from '../auth/decorators'
import { RolesGuard } from '../auth/guards/roles.guard'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'

/**
 * Daily-rotated IP hash. We never persist raw IPs — just sha256(ip + UTC date).
 * This lets us collapse burst-clicks from the same person on the same day in
 * a future de-dup pass without storing anything that ties back to an individual
 * across days. The salt is the date itself, which is fine for analytics-grade
 * privacy (not security) — the goal is "I can't reverse this into 'who'".
 */
function hashIp(ip: string | undefined): string | null {
  if (!ip) return null
  const day = new Date().toISOString().slice(0, 10)
  return createHash('sha256').update(`${ip}|${day}`).digest('hex')
}

function clientIp(req: Request): string | undefined {
  // X-Forwarded-For is set by every reasonable proxy (Cloudflare, Vercel, Render).
  // Trust the leftmost entry only when `trust proxy` is enabled in main.ts; here
  // we read it directly for hashing — even a spoofed value is fine since we never
  // expose it. Fall back to socket address if the header is absent (local dev).
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0]?.trim()
  return req.socket?.remoteAddress
}

// ── Public: storefront POSTs here on every inquiry-intent tap ─────────────────

@ApiTags('events')
@Controller({ path: 'events', version: '1' })
export class EventsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Post('product')
  @HttpCode(204)
  async createProductEvent(
    @Body(new ZodValidationPipe(CreateProductEventSchema)) dto: CreateProductEventDto,
    @Req() req: Request,
  ): Promise<void> {
    // Fire-and-forget at the storefront level (sendBeacon). We still await the
    // insert here because Prisma queues are short and we want the row to land
    // before the lambda freezes — but we never throw to the client. A failed
    // event is just lost analytics, not a failed user action.
    try {
      await this.prisma.productEvent.create({
        data: {
          productId: dto.productId,
          kind: dto.kind,
          ipHash: hashIp(clientIp(req)),
        },
      })
    } catch {
      // swallow — never let analytics break the call site
    }
  }
}

// ── Admin: rollups ────────────────────────────────────────────────────────────

@ApiTags('admin')
@Controller({ path: 'admin/analytics', version: '1' })
@UseGuards(RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminAnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Top N products by event count over the trailing window. Joins back to the
   * Product table for display fields. Single round-trip via $queryRaw — the
   * groupBy + findMany pattern needs two queries and an in-memory merge.
   */
  @Get('top-inquired')
  async topInquired(
    @Query(new ZodValidationPipe(TopInquiredQuerySchema)) q: TopInquiredQuery,
  ) {
    const since = new Date(Date.now() - q.days * 86_400_000)

    // groupBy returns counts keyed by productId; we then hydrate display fields.
    const grouped = await this.prisma.productEvent.groupBy({
      by: ['productId'],
      where: {
        createdAt: { gte: since },
        ...(q.kind ? { kind: q.kind } : {}),
      },
      _count: { _all: true },
      orderBy: { _count: { productId: 'desc' } },
      take: q.limit,
    })

    if (grouped.length === 0) {
      return { items: [], windowDays: q.days, kind: q.kind ?? null }
    }

    const productIds = grouped.map((g) => g.productId)
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        slug: true,
        images: { select: { url: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    })
    const byId = new Map(products.map((p) => [p.id, p]))

    // Bar width is relative to the top entry — that's what people read first.
    const max = grouped[0]?._count._all ?? 1

    const items = grouped
      .map((g) => {
        const p = byId.get(g.productId)
        if (!p) return null
        return {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          slug: p.slug,
          imageUrl: p.images[0]?.url ?? null,
          count: g._count._all,
          barPct: Math.round((g._count._all / max) * 100),
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)

    return { items, windowDays: q.days, kind: q.kind ?? null }
  }

  /**
   * Total events in the window, broken down by kind. Cheap KPI strip.
   */
  @Get('event-totals')
  async eventTotals(
    @Query(new ZodValidationPipe(TopInquiredQuerySchema)) q: TopInquiredQuery,
  ) {
    const since = new Date(Date.now() - q.days * 86_400_000)
    const rows = await this.prisma.productEvent.groupBy({
      by: ['kind'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    })
    const totals = Object.fromEntries(rows.map((r) => [r.kind, r._count._all]))
    return { totals, windowDays: q.days }
  }
}

@Module({
  controllers: [EventsController, AdminAnalyticsController],
})
export class EventsModule {}
