import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'

import { QUEUE_NAMES } from '../../infrastructure/queue/queue.constants'
import { SmsModule } from '../../infrastructure/sms/sms.module'
import { NotificationsService } from './notifications.service'
import { NotificationsProcessor } from './notifications.processor'

@Module({
  imports: [
    SmsModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.NOTIFICATIONS }),
  ],
  providers: [NotificationsService, NotificationsProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
