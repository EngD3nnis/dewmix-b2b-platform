'use client'

import { MessageCircle } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { trackProductEvent } from '@/lib/analytics/track'
import { env } from '@/env'

interface Props extends Omit<ButtonProps, 'onClick' | 'asChild'> {
  /** Required for click tracking — pass the product's UUID. */
  productId: string
  productName: string
  productSku?: string
  /** Custom message — falls back to the standard inquiry template. */
  customMessage?: string
}

export function WhatsAppInquiryButton({ productId, productName, productSku, customMessage, size = 'sm', className, ...rest }: Props) {
  const message =
    customMessage ??
    `Hello, I would like to inquire about ${productName}${productSku ? ` (SKU: ${productSku})` : ''}.`

  const href = `https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`

  const onClick = () => {
    // Fire-and-forget; sendBeacon guarantees the POST survives the popup open.
    trackProductEvent(productId, 'WHATSAPP_INQUIRY')
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <Button
      size={size}
      className={className}
      onClick={onClick}
      type="button"
      {...rest}
    >
      <MessageCircle className="h-3.5 w-3.5" />
      Order via WhatsApp
    </Button>
  )
}
