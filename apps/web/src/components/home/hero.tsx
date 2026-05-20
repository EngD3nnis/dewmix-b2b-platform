import Link from 'next/link'
import { Search, ShoppingBag, Zap, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { env } from '@/env'

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background dark:from-primary/10" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container py-12 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            B2B Hardware Procurement Platform · Kenol Road, Kenya
          </div>

          <h1 className="text-balance font-display text-display-2 font-bold tracking-tight">
            Browse. Build a quote.{' '}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Send via WhatsApp.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            Kenya's modern hardware supplier catalog. Search 4,000+ products, add them to a quote basket,
            and send a professional procurement inquiry in one tap. No calls. No confusion.
          </p>

          {/* Search */}
          <form action="/products" className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-xl border bg-background p-1.5 shadow-md">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" type="search" placeholder="Search cement, drills, paint, pipes..." className="h-11 border-0 pl-10 shadow-none focus-visible:ring-0" />
            </div>
            <Button type="submit" size="lg" className="h-11">Search</Button>
          </form>

          {/* Quick links */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>Popular:</span>
            {['Cement', 'Bosch Drill', 'Crown Paint', 'IBR Roofing', 'Steel Bars', 'PVC Pipes'].map((term) => (
              <Link key={term} href={`/products?q=${encodeURIComponent(term)}`}
                className="rounded-full border bg-background px-2.5 py-1 transition-colors hover:border-primary/30 hover:text-foreground">
                {term}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-4 rounded-2xl border bg-card p-5">
          {[
            { num: '4,000+', label: 'Products in catalog' },
            { num: '37', label: 'Product categories' },
            { num: '1 tap', label: 'to send a quote' },
          ].map(({ num, label }) => (
            <div key={label} className="text-center">
              <p className="font-display text-2xl font-bold sm:text-3xl">{num}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mx-auto mt-5 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: ShoppingBag, title: 'Quote basket', body: 'Add multiple products, set quantities, send one message.' },
            { icon: Zap, title: 'Instant inquiry', body: 'WhatsApp message pre-filled with product names and SKUs.' },
            { icon: Shield, title: 'Authentic stock', body: 'Direct from brands. Real inventory. Real specs.' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3 rounded-xl border bg-card p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
