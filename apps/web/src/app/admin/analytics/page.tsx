import Link from 'next/link'
import { TrendingUp, AlertTriangle, Package, ChevronRight, Inbox } from 'lucide-react'
import { env } from '@/env'

interface TopInquiredItem {
  productId: string
  name: string
  sku: string
  slug: string
  imageUrl: string | null
  count: number
  barPct: number
}

async function getStats() {
  try {
    const [statsRes, productsRes, topInquiredRes, totalsRes] = await Promise.all([
      fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/admin/stats`, { cache: 'no-store' }),
      fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/admin/products?pageSize=100`, { cache: 'no-store' }),
      fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/admin/analytics/top-inquired?days=7&limit=10`, { cache: 'no-store' }),
      fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/admin/analytics/event-totals?days=7`, { cache: 'no-store' }),
    ])
    const stats = statsRes.ok ? await statsRes.json() : null
    const productsData = productsRes.ok ? await productsRes.json() : null
    const topInquiredData = topInquiredRes.ok ? await topInquiredRes.json() : null
    const totalsData = totalsRes.ok ? await totalsRes.json() : null
    return {
      stats,
      products: productsData?.items ?? [],
      topInquired: (topInquiredData?.items ?? []) as TopInquiredItem[],
      eventTotals: (totalsData?.totals ?? {}) as Record<string, number>,
    }
  } catch {
    return { stats: null, products: [], topInquired: [], eventTotals: {} }
  }
}

export const metadata = { title: 'Analytics — Admin' }

export default async function AdminAnalyticsPage() {
  const { stats, products, topInquired, eventTotals } = await getStats()

  // Derive low-stock products from admin product list
  const lowStock = products.filter((p: { inStock: boolean; status: string }) =>
    !p.inStock || p.status === 'OUT_OF_STOCK'
  )

  const active = products.filter((p: { status: string }) => p.status === 'ACTIVE')
  const featured = products.filter((p: { isFeatured: boolean }) => p.isFeatured)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catalog performance overview — updated in real time
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total products', value: stats?.products ?? products.length, sub: 'in catalog' },
          { label: 'Active', value: stats?.activeProducts ?? active.length, sub: 'visible to customers' },
          { label: 'Featured', value: stats?.featuredProducts ?? featured.length, sub: 'on homepage' },
          { label: 'Low / out of stock', value: lowStock.length, sub: 'need attention', alert: lowStock.length > 0 },
        ].map(({ label, value, sub, alert }) => (
          <div
            key={label}
            className={`rounded-xl border p-5 ${alert && value > 0 ? 'border-warning/40 bg-warning/5' : 'bg-card'}`}
          >
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className={`mt-2 font-display text-3xl font-bold ${alert && value > 0 ? 'text-warning' : ''}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Low stock alerts */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b px-5 py-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="font-semibold">Stock alerts</h2>
            {lowStock.length > 0 && (
              <span className="ml-auto rounded-full bg-warning/15 px-2 py-0.5 text-xs font-bold text-warning">
                {lowStock.length} items
              </span>
            )}
          </div>
          {lowStock.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              All products are in stock ✓
            </div>
          ) : (
            <ul className="divide-y">
              {lowStock.slice(0, 8).map((p: { id: string; name: string; sku: string; status: string }) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                    {p.status.toLowerCase().replace('_', ' ')}
                  </span>
                  <Link href={`/admin/products/${p.id}`} className="shrink-0 text-muted-foreground hover:text-primary">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Inquiry tracking — live data from ProductEvent */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b px-5 py-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Most inquired products</h2>
            <span className="ml-auto text-xs text-muted-foreground">last 7 days</span>
          </div>
          {topInquired.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <Inbox className="h-7 w-7 text-muted-foreground/30" />
              <p className="text-sm font-medium">No inquiries tracked yet</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Counts start appearing here the moment a customer taps the WhatsApp button
                or adds a product to their quote basket. Share the catalog URL to seed real data.
              </p>
              {(eventTotals['WHATSAPP_INQUIRY'] ?? 0) + (eventTotals['QUOTE_ADD'] ?? 0) > 0 && (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  ({eventTotals['WHATSAPP_INQUIRY'] ?? 0} WhatsApp taps,{' '}
                  {eventTotals['QUOTE_ADD'] ?? 0} quote adds — pending rollup)
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2 px-5 py-4">
              {topInquired.map((p) => (
                <Link
                  key={p.productId}
                  href={`/admin/products/${p.productId}`}
                  className="block space-y-1 rounded-md px-1 py-1 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="ml-2 shrink-0 text-muted-foreground">{p.count} inquiries</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${p.barPct}%` }}
                    />
                  </div>
                </Link>
              ))}
              <p className="pt-2 text-[10px] text-muted-foreground">
                Counts include both single-product WhatsApp taps and quote-basket adds.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Featured products management */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b px-5 py-3">
          <Package className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Featured products</h2>
          <span className="ml-auto text-xs text-muted-foreground">{featured.length} products on homepage</span>
          <Link href="/admin/products" className="text-xs text-primary hover:underline">Manage →</Link>
        </div>
        {featured.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No featured products. Mark products as featured in{' '}
            <Link href="/admin/products" className="text-primary hover:underline">Product management</Link>.
          </div>
        ) : (
          <ul className="divide-y">
            {featured.slice(0, 5).map((p: { id: string; name: string; sku: string; inStock: boolean }) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`h-2 w-2 rounded-full ${p.inStock ? 'bg-success' : 'bg-destructive'}`} />
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</p>
                <span className={`shrink-0 text-xs ${p.inStock ? 'text-success' : 'text-destructive'}`}>
                  {p.inStock ? 'In stock' : 'Out of stock'}
                </span>
                <Link href={`/admin/products/${p.id}`} className="shrink-0 text-muted-foreground hover:text-primary">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
