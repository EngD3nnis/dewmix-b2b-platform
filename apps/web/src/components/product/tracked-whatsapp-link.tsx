'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackProductEvent } from '@/lib/analytics/track'
import { env } from '@/env'

interface Props {
  productId: string
  productName: string
  productSku?: string
  /** Defaults to "Inquire on WhatsApp" — the secondary-action wording. */
  label?: string
  /** Override the prefilled message. Falls back to the standard template. */
  customMessage?: string
  className?: string
}

/**
 * Single-product WhatsApp inquiry link that records the click before opening
 * WhatsApp. Use this in Server Components (the link itself is a plain <a> so
 * SSR works); the click handler runs only on the client. Tracking is
 * fire-and-forget — sendBeacon queues the POST and WhatsApp opens in a new
 * tab without waiting.
 */
export function TrackedWhatsAppLink({
  productId,
  productName,
  productSku,
  label = 'Inquire on WhatsApp',
  customMessage,
  className,
}: Props) {
  const message =
    customMessage ??
    `Hello, I would like to inquire about ${productName}${productSku ? ` (SKU: ${productSku})` : ''}.`
  const href = `https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={() => trackProductEvent(productId, 'WHATSAPP_INQUIRY')}
    >
      <Button variant="outline" size="sm" className="w-full" type="button">
        <MessageCircle className="h-4 w-4 text-[#25D366]" />
        {label}
      </Button>
    </a>
  )
}
