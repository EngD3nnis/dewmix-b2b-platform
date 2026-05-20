import { Inject, Logger } from '@nestjs/common'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import type { Job } from 'bullmq'

import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { QUEUE_NAMES } from '../../infrastructure/queue/queue.constants'
import { SMS_PROVIDER, type SmsProvider } from '../../infrastructure/sms/sms.interface'
import type { NotificationJob } from './notifications.service'
import { adminInquiryReceivedSms } from './notification-templates'

/**
 * Notifications worker. Runs in-process with the API for MVP; can be extracted
 * to a dedicated worker process by bootstrapping a second Nest application
 * that imports QueueModule + NotificationsModule and nothing else.
 *
 * Concurrency + rate limiting are conservative: Africa's Talking sandbox
 * allows bursts but the destination phones are real people — 10 SMS/sec is
 * plenty for any realistic inquiry volume and well under any provider limit.
 *
 * Error semantics: throwing from `process()` triggers BullMQ retry with the
 * exponential backoff configured in QueueModule (1s → 2s → 4s, 3 attempts).
 * After exhaustion the job lands in `failed` and an alert can be wired
 * later. We deliberately do not catch-and-swallow here — silent SMS failures
 * are worse than loud failures because no-one notices.
 */
@Processor(QUEUE_NAMES.NOTIFICATIONS, {
  concurrency: 5,
  limiter: { max: 10, duration: 1_000 }, // 10 jobs / second cap
})
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {
    super()
  }

  async process(job: Job<NotificationJob>): Promise<void> {
    switch (job.data.kind) {
      case 'admin.inquiry.received':
        return this.handleAdminInquiryReceived(job.data.inquiryId)
      default: {
        // Exhaustiveness check — TypeScript flags new variants we forgot here.
        const _exhaustive: never = job.data.kind
        throw new Error(`Unknown notification kind: ${String(_exhaustive)}`)
      }
    }
  }

  private async handleAdminInquiryReceived(inquiryId: string): Promise<void> {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id: inquiryId } })
    if (!inquiry) {
      // Inquiry was deleted between enqueue and process. Not an error worth
      // retrying — just log and finish.
      this.logger.warn(`Inquiry ${inquiryId} not found at notification time — skipping`)
      return
    }

    const recipients = await this.resolveAdminRecipients()
    if (recipients.length === 0) {
      this.logger.warn(
        `No admin recipients configured (no users with phone, no ADMIN_NOTIFICATION_PHONE) — skipping inquiry ${inquiryId}`,
      )
      return
    }

    const webUrl = process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000'
    const items = Array.isArray(inquiry.items) ? inquiry.items.length : 0
    const customerPhone = extractCustomerPhone(inquiry.items)

    const message = adminInquiryReceivedSms({
      referenceNumber: inquiry.referenceNumber,
      itemCount: items,
      adminLink: `${webUrl}/admin/inquiries`,
      customerPhone,
    })

    // Parallel sends — recipient list is small (1–5 admins typical). If one
    // recipient errors we still want the others to receive theirs, so we
    // allSettled and aggregate. A failure on any send re-throws to trigger
    // BullMQ retry (which will re-send to *all* recipients — acceptable for
    // SMS since duplicates are obvious to a human reader).
    const results = await Promise.allSettled(
      recipients.map((to) => this.sms.send(to, message)),
    )

    const failures = results.filter(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'failed'),
    )
    if (failures.length > 0) {
      this.logger.error(
        `SMS delivery failed for ${failures.length}/${recipients.length} recipients on inquiry ${inquiryId}`,
      )
      throw new Error(`${failures.length} SMS delivery failures`)
    }

    this.logger.log(
      `Sent inquiry-received SMS to ${recipients.length} admin(s) for ${inquiry.referenceNumber}`,
    )
  }

  /**
   * Recipient list = every user with role ADMIN/SUPER_ADMIN that has a phone,
   * plus the env-configured fallback. The env fallback is essential for first
   * launch when no admin user exists yet (or has logged in to set their phone).
   * De-duped because the env fallback often overlaps with the seeded admin.
   */
  private async resolveAdminRecipients(): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        status: 'ACTIVE',
        phone: { not: null },
        deletedAt: null,
      },
      select: { phone: true },
    })
    const recipients = new Set<string>(
      users.map((u) => u.phone).filter((p): p is string => p !== null),
    )
    const fallback = process.env.ADMIN_NOTIFICATION_PHONE
    if (fallback) recipients.add(fallback)
    return [...recipients]
  }
}

/**
 * Best-effort extraction of the customer phone from the inquiry's `items`
 * blob. The blob shape is owned by the storefront (see quote message helper)
 * and may include a `contact` field. If absent, return undefined — the SMS
 * template handles that case.
 */
function extractCustomerPhone(items: unknown): string | undefined {
  if (!items || typeof items !== 'object') return undefined
  // Storefront writes either an array or an envelope { contact, items }.
  if (Array.isArray(items)) return undefined
  const obj = items as Record<string, unknown>
  const contact = obj['contact']
  if (contact && typeof contact === 'object' && contact !== null) {
    const phone = (contact as Record<string, unknown>)['phone']
    if (typeof phone === 'string' && phone.length > 0) return phone
  }
  return undefined
}
