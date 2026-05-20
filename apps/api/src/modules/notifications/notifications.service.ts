import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { QUEUE_NAMES } from '../../infrastructure/queue/queue.constants'

/**
 * Job payload registry. Discriminated by `kind` so the processor can switch
 * exhaustively and TypeScript will flag a missing case when we add new types.
 * Each new notification trigger adds a member here, a case in the processor,
 * and (optionally) a template — nothing else.
 */
export type NotificationJob =
  | { kind: 'admin.inquiry.received'; inquiryId: string }
  // Future:
  // | { kind: 'admin.low_stock_digest'; productIds: string[] }
  // | { kind: 'customer.inquiry.received'; inquiryId: string }

export type NotificationJobKind = NotificationJob['kind']

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS) private readonly queue: Queue<NotificationJob>,
  ) {}

  /**
   * Enqueue the admin-inquiry-received notification. Idempotent on
   * `inquiryId`: BullMQ rejects duplicate `jobId`s, so a retry on the inquiry
   * POST won't fan out a second SMS. The producer always resolves so a queue
   * failure never propagates back into the inquiry response.
   */
  async notifyAdminOfInquiry(inquiryId: string): Promise<void> {
    try {
      await this.queue.add(
        'admin.inquiry.received',
        { kind: 'admin.inquiry.received', inquiryId },
        {
          // Job ID is the dedup key. If the inquiry create somehow runs twice,
          // the second enqueue is a no-op.
          jobId: `inquiry:${inquiryId}:notify-admin`,
        },
      )
    } catch (err) {
      // A failed enqueue means Redis is down. The inquiry is already
      // persisted; the admin will see it in /admin/inquiries when they next
      // open the page. Log loudly, do not throw.
      this.logger.error(
        `Failed to enqueue admin notification for inquiry ${inquiryId}: ${(err as Error).message}`,
      )
    }
  }
}
