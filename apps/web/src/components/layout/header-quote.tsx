'use client'

import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuoteStore, useQuoteCount } from '@/stores/quote'

export function HeaderQuote() {
  const count = useQuoteCount()
  const toggle = useQuoteStore((s) => s.toggle)

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Quote basket, ${count} item${count !== 1 ? 's' : ''}`}
      onClick={toggle}
      className="relative"
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
          aria-hidden
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  )
}
