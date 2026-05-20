/**
 * Queue name registry. Centralised so a typo can't accidentally create a
 * second queue with a similar name (which would silently drop jobs into the
 * void from the producer's perspective).
 */
export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]
