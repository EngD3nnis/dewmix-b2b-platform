'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Trash2, MessageCircle, ArrowLeft, Package, Minus, Plus, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuoteBasket } from '@/stores/quote-basket'
import { env } from '@/env'

export default function QuotePage() {
  const router = useRouter()
  const { items, referenceNumber, update, remove, clear, generateWhatsAppMessage } = useQuoteBasket()
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const message = generateWhatsAppMessage(env.NEXT_PUBLIC_WHATSAPP_NUMBER)
  const whatsappHref = `https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`

  const handleSendQuote = () => {
    fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        referenceNumber,
        items: items.map((i) => ({ productId: i.productId, name: i.name, sku: i.sku, quantity: i.quantity })),
        message,
      }),
    }).catch(() => {})

    setSent(true)
    window.open(whatsappHref, '_blank', 'noopener,noreferrer')
    setTimeout(() => { clear(); router.push('/products') }, 2500)
  }

  if (sent) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
            <MessageCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold">Quote request sent!</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your inquiry has opened in WhatsApp. Our team will respond shortly.</p>
          <p className="mt-4 font-mono text-sm">Reference: <span className="font-semibold">{referenceNumber}</span></p>
          <p className="mt-6 text-xs text-muted-foreground">Returning to catalog...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold">Your quote basket is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse our catalog, add products, and send a quote request via WhatsApp in seconds.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/products"><ArrowLeft className="h-4 w-4" /> Browse catalog</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 lg:py-12">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Quote Basket</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {items.length} product{items.length !== 1 ? 's' : ''} · {totalItems} unit{totalItems !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Quote reference</p>
            <p className="font-mono text-sm font-semibold">{referenceNumber}</p>
          </div>
          <button type="button" onClick={() => { navigator.clipboard.writeText(referenceNumber); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="ml-2 grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="hidden border-b bg-secondary/30 px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-[1fr_auto_auto]">
              <span>Product</span><span className="text-center">Quantity</span><span className="w-8" />
            </div>

            {items.map((item) => (
              <div key={item.productId} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b px-5 py-4 last:border-b-0 sm:grid-cols-[1fr_auto_auto]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-secondary/40">
                    {item.imageUrl
                      ? <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-cover" />
                      : <div className="grid h-full place-items-center"><Package className="h-5 w-5 text-muted-foreground/30" /></div>}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/products/${item.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-primary">{item.name}</Link>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">SKU: {item.sku}{item.category && <span className="ml-2 opacity-60">· {item.category}</span>}</p>
                    {item.minOrderQty > 1 && <p className="mt-0.5 text-xs text-muted-foreground">Min. order: {item.minOrderQty} units</p>}
                  </div>
                </div>

                <div className="inline-flex items-center rounded-md border bg-background">
                  <button type="button" onClick={() => update(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} className="grid h-9 w-9 place-items-center rounded-l-md hover:bg-accent disabled:opacity-40"><Minus className="h-3.5 w-3.5" /></button>
                  <input type="number" min={1} value={item.quantity} onChange={(e) => update(item.productId, parseInt(e.target.value) || 1)} className="h-9 w-16 border-x bg-transparent text-center text-sm font-medium tabular focus:outline-none" />
                  <button type="button" onClick={() => update(item.productId, item.quantity + 1)} className="grid h-9 w-9 place-items-center rounded-r-md hover:bg-accent"><Plus className="h-3.5 w-3.5" /></button>
                </div>

                <button type="button" onClick={() => remove(item.productId)} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" asChild size="sm" className="text-muted-foreground">
              <Link href="/products"><ArrowLeft className="h-4 w-4" /> Continue browsing</Link>
            </Button>
            <button type="button" onClick={() => { if (confirm('Clear all items?')) clear() }} className="text-xs text-muted-foreground hover:text-destructive">Clear basket</button>
          </div>
        </div>

        <div>
          <div className="sticky top-24 space-y-4">
            <div className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold">Quote summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Products</dt><dd className="font-medium">{items.length}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Total units</dt><dd className="tabular font-medium">{totalItems}</dd></div>
                <div className="flex justify-between border-t pt-2"><dt className="text-muted-foreground">Pricing</dt><dd className="text-xs text-primary">Provided on inquiry</dd></div>
              </dl>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold">Message preview</h2>
              <pre className="max-h-52 overflow-y-auto rounded-md bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">{message}</pre>
            </div>

            <Button size="lg" className="w-full bg-[#25D366] text-white hover:bg-[#22bc5c]" onClick={handleSendQuote}>
              <MessageCircle className="h-5 w-5" />
              Request Quote via WhatsApp
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Opens WhatsApp with your full product list pre-filled.<br />
              Our team responds within 1 business hour.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
