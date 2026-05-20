import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'

import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { QueueModule } from './infrastructure/queue/queue.module'
import { HealthModule } from './modules/health/health.module'
import { CatalogModule } from './modules/catalog/catalog.module'
import { AuthModule } from './modules/auth/auth.module'
import { AdminModule } from './modules/admin/admin.module'
import { UploadsModule } from './modules/uploads/uploads.module'
import { InquiriesModule } from './modules/inquiries/inquiries.module'
import { EventsModule } from './modules/events/events.module'
import { NotificationsModule } from './modules/notifications/notifications.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' } }
            : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    QueueModule,
    HealthModule,
    AuthModule,
    CatalogModule,
    AdminModule,
    UploadsModule,
    NotificationsModule,
    InquiriesModule,
    EventsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
