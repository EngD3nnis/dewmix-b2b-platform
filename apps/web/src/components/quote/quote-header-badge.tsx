'use client'

import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuoteCount, useQuoteStore } from '@/stores/quote'

export function QuoteHeaderBadge() {
  const count = useQuoteCount()
  const open = useQuoteStore((s) => s.openDrawer)

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Quote basket — ${count} items`}
      className="relative"
      onClick={open}
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold tabular text-primary-foreground"
          aria-hidden
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  )
}
