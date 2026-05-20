// packages/utils/src/index.ts
// Pure utility functions used across web and api.

/** Format integer cents → "KSh 12,500" or "KSh 12,500.00" with locale awareness. */
export function formatPrice(
  cents: number,
  currency: string = 'KES',
  options: { showDecimals?: boolean } = {}
): string {
  const amount = cents / 100
  const symbol = currency === 'KES' ? 'KSh' : currency
  const formatted = new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: options.showDecimals ? 2 : 0,
    maximumFractionDigits: options.showDecimals ? 2 : 0,
  }).format(amount)
  return `${symbol} ${formatted}`
}

/** Compute % discount given price and compareAt. Returns null if no discount. */
export function discountPercent(priceCents: number, compareAtCents: number | null | undefined): number | null {
  if (!compareAtCents || compareAtCents <= priceCents) return null
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100)
}

/** Slugify a string for URL use. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Generate a human-readable order number: ORD-2026-0001 */
export function generateOrderNumber(sequence: number, year = new Date().getFullYear()): string {
  return `ORD-${year}-${sequence.toString().padStart(5, '0')}`
}

/** Format a phone for display: +254712345678 → 0712 345 678 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length === 12) {
    return `0${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
  }
  return phone
}

/** Build a WhatsApp link with optional prefilled text. */
export function whatsappLink(phone: string, message?: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const base = `https://wa.me/${cleaned}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

/** Async sleep — used in tests and for backoff. */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Type-safe object entries. */
export function entries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][]
}

/** Clamp a number to a range. */
export const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)
