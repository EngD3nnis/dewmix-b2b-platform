'use client'

import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { useQuoteStore, type QuoteItem } from '@/stores/quote'
import { trackProductEvent } from '@/lib/analytics/track'

type Props = Omit<ButtonProps, 'onClick'> & {
  product: Omit<QuoteItem, 'quantity'>
  label?: string
}

export function AddToQuoteButton({ product, label = 'Add to Quote', size = 'sm', className, ...rest }: Props) {
  const add = useQuoteStore((s) => s.add)
  const isInBasket = useQuoteStore((s) => s.items.some((i) => i.productId === product.productId))
  const [flash, setFlash] = useState(false)

  const onClick = () => {
    add(product)
    // Only count the first add per product per session as inquiry intent —
    // re-adds (increment qty) are noise. The store's `add` mutates `items`
    // synchronously so `isInBasket` here is the *prior* state.
    if (!isInBasket) {
      trackProductEvent(product.productId, 'QUOTE_ADD')
    }
    setFlash(true)
    setTimeout(() => setFlash(false), 1500)
  }

  return (
    <Button
      size={size}
      className={className}
      onClick={onClick}
      type="button"
      variant={isInBasket ? 'outline' : 'default'}
      {...rest}
    >
      {flash ? <Check className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
      {flash ? 'Added!' : isInBasket ? 'In Quote' : label}
    </Button>
  )
}
