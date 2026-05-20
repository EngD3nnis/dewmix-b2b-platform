'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Trash2, Package, MessageCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuoteStore } from '@/stores/quote'
import { env } from '@/env'
import { cn } from '@/lib/utils'

export function QuoteDrawer() {
  const { items, isOpen, closeDrawer, removeItem, updateQty, clear, totalItems, generateWhatsAppMessage } = useQuoteStore()
  const [location, setLocation] = useState('')
  const [contactName, setContactName] = useState('')

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeDrawer])

  const sendQuote = () => {
    const msg = generateWhatsAppMessage(contactName, location)
    const url = `https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeDrawer}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Quote basket"
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-card shadow-xl transition-transform duration-300 ease-out-expo',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Quote basket</h2>
            <p className="text-xs text-muted-foreground">
              {totalItems()} {totalItems() === 1 ? 'item' : 'items'} — no prices shown
            </p>
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clear} className="text-xs text-muted-foreground">
                Clear all
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={closeDrawer} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                <Package className="h-7 w-7" />
              </div>
              <p className="mt-4 font-medium">Your quote basket is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse products and add items to build a quote request.
              </p>
              <Button variant="outline" size="sm" className="mt-5" onClick={closeDrawer} asChild>
                <Link href="/products">Browse products</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.sku} className="flex gap-3 rounded-xl border bg-background p-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-secondary/40">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <Package className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeDrawer}
                      className="line-clamp-2 text-sm font-medium hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">SKU: {item.sku}</p>

                    <div className="mt-2 flex items-center justify-between">
                      {/* Qty stepper */}
                      <div className="flex items-center gap-0 rounded-md border">
                        <button
                          type="button"
                          onClick={() => updateQty(item.sku, item.quantity - 1)}
                          className="grid h-7 w-7 place-items-center rounded-l-md text-muted-foreground hover:bg-accent hover:text-foreground"
                          aria-label="Decrease"
                        >
                          <span className="text-base leading-none">−</span>
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateQty(item.sku, parseInt(e.target.value) || 1)}
                          className="h-7 w-12 border-x bg-transparent text-center text-sm tabular focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateQty(item.sku, item.quantity + 1)}
                          className="grid h-7 w-7 place-items-center rounded-r-md text-muted-foreground hover:bg-accent hover:text-foreground"
                          aria-label="Increase"
                        >
                          <span className="text-base leading-none">+</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.sku)}
                        className="p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                        aria-label="Remove"
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

        {/* Footer — only shown when items exist */}
        {items.length > 0 && (
          <div className="border-t bg-card p-5 space-y-3">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none"
              />
              <input
                type="text"
                placeholder="Delivery location, e.g. Westlands, Nairobi (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none"
              />
            </div>

            <Button
              size="lg"
              className="w-full bg-[#25D366] text-white hover:bg-[#22bc5c]"
              onClick={sendQuote}
            >
              <MessageCircle className="h-5 w-5" />
              Request Quote via WhatsApp
            </Button>

            <Button variant="outline" size="sm" className="w-full" asChild onClick={closeDrawer}>
              <Link href="/quote">
                View full quote <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              No payment required — we'll respond with pricing and availability.
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
