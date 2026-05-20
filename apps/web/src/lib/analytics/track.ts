import type { ProductEventKind } from '@dewmix/types'
import { env } from '@/env'

/**
 * Fire-and-forget product event POST.
 *
 * Uses `navigator.sendBeacon` so the request survives the page transition that
 * follows almost every call here (opening WhatsApp, navigating to the quote
 * page, etc). The browser queues the POST and delivers it after the current
 * frame, so we never block the user's tap.
 *
 * Failure modes (offline, blocked, ad-blocker, sendBeacon unavailable on the
 * platform) all degrade silently — analytics is best-effort and must never
 * intercept a user action. We deliberately do not surface errors.
 */
export function trackProductEvent(
  productId: string,
  kind: ProductEventKind,
): void {
  if (typeof window === 'undefined') return // server side — no-op
  if (!productId) return

  const url = `${env.NEXT_PUBLIC_API_URL}/api/v1/events/product`
  const payload = JSON.stringify({ productId, kind })

  try {
    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' })
      // sendBeacon ignores its return value in practice; check it only to be
      // explicit. If it refuses (payload too large, etc) fall through to fetch.
      const queued = navigator.sendBeacon(url, blob)
      if (queued) return
    }

    // Fallback: keepalive fetch. Same fire-and-forget semantics — the browser
    // is allowed to keep this request alive across the unload event. We don't
    // await; we don't care about the response; we suppress the unhandled
    // rejection with `.catch(() => {})`.
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {})
  } catch {
    // Never throw from analytics.
  }
}
