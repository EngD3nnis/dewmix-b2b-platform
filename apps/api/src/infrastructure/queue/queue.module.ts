import { Global, Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'

/**
 * Global queue infrastructure. Provides the shared Redis connection that
 * every queue and worker in the app uses.
 *
 * Why global: BullMQ's `BullModule.forRoot` registers a default connection
 * that subsequent `BullModule.registerQueue` calls pick up implicitly. If we
 * scoped this to a feature module, every feature that wants a queue would
 * have to import it explicitly, which becomes noise as the queue count grows.
 *
 * Redis connection notes:
 *   - `maxRetriesPerRequest: null` is REQUIRED by BullMQ. The library uses
 *     blocking commands (BRPOP, BLPOP) that hold a connection open for many
 *     seconds; ioredis would otherwise retry-then-error those legitimate long
 *     waits. Forgetting this turns into "worker is stuck" bug reports.
 *   - `enableReadyCheck: false` skips a startup INFO call. Saves ~50ms of
 *     boot time and works on every Redis/Upstash/managed-Redis we'd use.
 *
 * Worker process model: in this MVP the workers run in-process with the API
 * (see notifications.processor.ts). To extract to a separate worker process
 * later, create a second Nest application bootstrap that imports only
 * QueueModule + the feature modules whose processors should run there.
 */
@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        // ioredis accepts a full URL via the special `path` form — but the
        // typings want host/port. The most portable approach is to parse here.
        ...parseRedisUrl(process.env.REDIS_URL ?? 'redis://localhost:6379'),
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      },
      // Sensible defaults applied to every job in the app. Individual
      // producers can override per-job.
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1_000 },
        removeOnComplete: { age: 24 * 3600, count: 100 },
        removeOnFail: { age: 7 * 24 * 3600, count: 500 },
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}

function parseRedisUrl(url: string): { host: string; port: number; password?: string; username?: string; tls?: object } {
  const u = new URL(url)
  const out: ReturnType<typeof parseRedisUrl> = {
    host: u.hostname,
    port: u.port ? Number(u.port) : 6379,
  }
  if (u.password) out.password = decodeURIComponent(u.password)
  if (u.username) out.username = decodeURIComponent(u.username)
  // rediss:// → TLS. Upstash and most managed providers ship this scheme.
  if (u.protocol === 'rediss:') out.tls = {}
  return out
}
