import { Injectable, Logger } from '@nestjs/common'
import type { CreateInquiryDto } from '@dewmix/types'

import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'

/**
 * Owns the inquiry create flow: persist → enqueue admin notification.
 *
 * Idempotency: `referenceNumber` is `@unique` in the schema, so a customer
 * who double-taps the WhatsApp send button generates two POSTs but only one
 * row. We catch the unique-constraint violation, treat it as success, and
 * skip the notification enqueue — otherwise the admin would receive two SMS
 * for one inquiry.
 */
@Injectable()
export class InquiriesService {
  private readonly logger = new Logger(InquiriesService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateInquiryDto): Promise<{ ok: true; id?: string }> {
    let inquiryId: string | null = null
    try {
      const inquiry = await this.prisma.inquiry.create({
        data: {
          referenceNumber: dto.referenceNumber,
          items: dto.items,
          message: dto.message,
          status: 'NEW',
        },
      })
      inquiryId = inquiry.id
    } catch (err) {
      // Prisma throws P2002 on unique-constraint violation. Without the
      // narrow check we'd swallow real errors (DB down, invalid FK, etc).
      const code = (err as { code?: string }).code
      if (code === 'P2002') {
        this.logger.log(`Duplicate inquiry ${dto.referenceNumber} — treating as idempotent re-submit`)
        return { ok: true }
      }
      throw err
    }

    // Fire-and-forget enqueue. Notifications service itself swallows errors
    // so this never throws — but await is still here to surface logs in the
    // same request cycle for easier debugging in dev.
    await this.notifications.notifyAdminOfInquiry(inquiryId)

    return { ok: true, id: inquiryId }
  }
}
