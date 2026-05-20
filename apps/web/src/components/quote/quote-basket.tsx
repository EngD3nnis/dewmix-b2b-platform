'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  X, Trash2, MessageCircle, ShoppingBag, Minus, Plus, Copy, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuoteStore } from '@/stores/quote'
import { buildWhatsAppHref, buildWhatsAppMessage, generateQuoteRef } from '@/lib/quote/message'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export function QuoteBasket() {
  const { items, isOpen, close, update, remove, clear } = useQuoteStore()
  const [ref] = useState(() => generateQuoteRef())
  const [copied, setCopied] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleSend = () => {
    // Log the inquiry intent so the admin can see demand even if the
    // customer never sends the WhatsApp message. Fire-and-forget —
    // a network failure must not block the customer's WhatsApp handoff.
    const payload = {
      referenceNumber: ref,
      items: items.map((i) => ({
        productId: i.productId,
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
      })),
      message: buildWhatsAppMessage(items, ref),
    }
    try {
      fetch(`${API_URL}/api/v1/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true, // survives the WhatsApp tab-open below
      }).catch(() => {
        /* silent — analytics, not a hard dependency */
      })
    } catch {
      /* same */
    }

    const href = buildWhatsAppHref(items, ref)
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  const handleCopyRef = async () => {
    await navigator.clipboard.writeText(ref)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={close}
        className={cn(
          'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Quote basket"
        aria-modal
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-xl transition-transform duration-300 ease-out-expo',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-display text-base font-bold">Quote Basket</h2>
            <p className="text-xs text-muted-foreground">
              {items.length === 0
                ? 'No items yet'
                : `${items.length} product${items.length !== 1 ? 's' : ''} · send for pricing`}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={close} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary text-muted-foreground">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium">Your quote basket is empty</p>
              <p className="text-xs text-muted-foreground">
                Browse products and tap "Add to Quote" to build your inquiry.
              </p>
              <Button variant="outline" size="sm" onClick={close} className="mt-2">
                Browse catalog
              </Button>
            </div>
          ) : (
            <ul className="divide-y p-4 space-y-1">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3 py-3">
                  {/* Image */}
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-secondary/40">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{item.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">SKU: {item.sku}</p>

                    {/* Quantity stepper */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="inline-flex items-center rounded-md border bg-background">
                        <button
                          type="button"
                          onClick={() => update(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="grid h-7 w-7 place-items-center rounded-l-md transition-colors hover:bg-accent disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="grid h-7 min-w-[2.5rem] place-items-center border-x px-1 text-center text-sm tabular font-medium">
                          {item.quantity.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => update(item.productId, item.quantity + 1)}
                          className="grid h-7 w-7 place-items-center rounded-r-md transition-colors hover:bg-accent"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.productId)}
                        className="ml-auto text-muted-foreground transition-colors hover:text-destructive"
                        aria-label="Remove from quote"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — sticky CTA */}
        {items.length > 0 && (
          <div className="border-t bg-background p-4 space-y-3">
            {/* Reference */}
            <div className="flex items-center justify-between rounded-lg border bg-secondary/40 px-3 py-2">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Quote reference</p>
                <p className="font-mono text-sm font-semibold">{ref}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyRef}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Copy reference"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* Summary */}
            <p className="text-xs text-muted-foreground text-center">
              {items.length} product{items.length !== 1 ? 's' : ''} ·{' '}
              {items.reduce((s, i) => s + i.quantity, 0).toLocaleString()} total units
            </p>

            {/* WhatsApp CTA */}
            <Button
              size="lg"
              className="w-full bg-[#25D366] text-white hover:bg-[#22bc5c] active:bg-[#1da851]"
              onClick={handleSend}
            >
              <MessageCircle className="h-5 w-5" />
              Request Quote via WhatsApp
            </Button>

            <button
              type="button"
              onClick={clear}
              className="w-full text-center text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear basket
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
