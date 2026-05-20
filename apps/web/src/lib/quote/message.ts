import type { QuoteItem } from '@/stores/quote'
import { env } from '@/env'

/**
 * Generates a formatted B2B procurement inquiry for WhatsApp.
 * This is the entire value proposition of the demo in one function.
 *
 * Output example:
 *
 * Hello Dewmix Hardware! 👋
 *
 * I'd like to request a quote for the following items:
 *
 * ━━━━━━━━━━━━━━━━━━━━━━
 * 📋 QUOTE REQUEST
 * Reference: DWX-20260519-4821
 * ━━━━━━━━━━━━━━━━━━━━━━
 *
 * 1. Bamburi Nguvu OPC Cement 50kg
 *    Qty: 100 bags | SKU: BMB-OPC-50
 *
 * 2. Devki Y16 Deformed Steel Bar 12m
 *    Qty: 40 pcs | SKU: DVK-Y16
 *
 * ━━━━━━━━━━━━━━━━━━━━━━
 * Please advise on pricing, availability, and delivery.
 * Thank you!
 */

export function generateQuoteRef(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `DWX-${dateStr}-${rand}`
}

export function buildWhatsAppMessage(items: QuoteItem[], ref: string): string {
  const divider = '━━━━━━━━━━━━━━━━━━━━━━'

  const itemLines = items
    .map(
      (item, i) =>
        `${i + 1}. ${item.name}\n   Qty: ${item.quantity.toLocaleString()} | SKU: ${item.sku}`
    )
    .join('\n\n')

  const message = [
    'Hello Dewmix Hardware! 👋',
    '',
    "I'd like to request a quote for the following items:",
    '',
    divider,
    '📋 QUOTE REQUEST',
    `Reference: ${ref}`,
    divider,
    '',
    itemLines,
    '',
    divider,
    'Please advise on:',
    '• Pricing and availability',
    '• Bulk discount (if applicable)',
    '• Estimated delivery timeline',
    '',
    'Thank you!',
  ].join('\n')

  return message
}

export function buildWhatsAppHref(items: QuoteItem[], ref: string): string {
  const message = buildWhatsAppMessage(items, ref)
  const phone = env.NEXT_PUBLIC_WHATSAPP_NUMBER
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
