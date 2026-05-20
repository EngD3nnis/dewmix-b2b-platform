import { Suspense } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { listProducts } from '@/lib/api/products'
import { listCategories } from '@/lib/api/categories'
import { ProductCard } from '@/components/product/product-card'
import { ProductGridSkeleton } from '@/components/product/product-card-skeleton'
import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ProductListQuery } from '@dewmix/types'

export const metadata: Metadata = {
  title: 'Products — Dewmix Hardware Catalog',
  description: 'Browse our full catalog of hardware, tools, building materials and construction supplies. Kenol Road, Kenya.',
}

type SearchParams = Promise<{
  q?: string; category?: string; brand?: string; inStock?: string
  sort?: ProductListQuery['sort']; page?: string
}>

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const categories = await listCategories().catch(() => [])

  return (
    <div className="container py-8 lg:py-12">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Product Catalog</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Browse and inquire via WhatsApp · Kenol Road, Kenya
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters — desktop */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <FilterSidebar categories={categories} activeCategory={params.category} />
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Search + sort toolbar */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <form action="/products" className="flex-1">
              {params.category && <input type="hidden" name="category" value={params.category} />}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="q"
                  type="search"
                  defaultValue={params.q}
                  placeholder="Search products, SKUs, brands..."
                  className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </form>

            {/* Mobile filter trigger — category chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              <Link
                href="/products"
                className={cn(
                  'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  !params.category ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary/30'
                )}
              >
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.slug}`}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    params.category === c.slug ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary/30'
                  )}
                >
                  {c.name}
                </Link>
              ))}
            </div>

            {/* Sort */}
            <form action="/products" method="get">
              {params.q && <input type="hidden" name="q" value={params.q} />}
              {params.category && <input type="hidden" name="category" value={params.category} />}
              <select
                name="sort"
                defaultValue={params.sort ?? 'popularity'}
                onChange={(e) => (e.target.form as HTMLFormElement).submit()}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:border-primary focus-visible:outline-none"
              >
                <option value="popularity">Most popular</option>
                <option value="newest">Newest</option>
              </select>
            </form>
          </div>

          {/* Active filter badge */}
          {params.category && (
            <div className="mb-4 flex items-center gap-2 text-sm">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Filtered by:</span>
              <span className="font-medium">{categories.find(c => c.slug === params.category)?.name}</span>
              <Link href="/products" className="text-xs text-primary hover:underline">Clear</Link>
            </div>
          )}

          <Suspense key={JSON.stringify(params)} fallback={<ProductGridSkeleton count={12} />}>
            <ProductGrid params={params} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

async function ProductGrid({ params }: { params: Awaited<SearchParams> }) {
  const page = params.page ? parseInt(params.page, 10) : 1
  let data
  try {
    data = await listProducts({ page, pageSize: 24, q: params.q, category: params.category, sort: params.sort ?? 'popularity' })
  } catch {
    return <p className="py-12 text-center text-muted-foreground">Could not load products. Is the API running?</p>
  }

  if (data.items.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-16 text-center">
        <p className="text-muted-foreground">No products match your search.</p>
        <Link href="/products" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">Clear filters</Link>
      </div>
    )
  }

  return (
    <>
      <p className="mb-4 text-xs text-muted-foreground">
        Showing {((page - 1) * 24) + 1}–{Math.min(page * 24, data.total)} of {data.total.toLocaleString()} products
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-4">
        {data.items.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
      </div>
      {data.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Link href={`/products?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), ...(params.category ? { category: params.category } : {}), page: String(page - 1) })}`} className="rounded-md border bg-card px-4 py-2 text-sm hover:border-primary/30">← Previous</Link>
          )}
          <span className="rounded-md border bg-primary px-4 py-2 text-sm text-primary-foreground">{page} of {data.totalPages}</span>
          {page < data.totalPages && (
            <Link href={`/products?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), ...(params.category ? { category: params.category } : {}), page: String(page + 1) })}`} className="rounded-md border bg-card px-4 py-2 text-sm hover:border-primary/30">Next →</Link>
          )}
        </div>
      )}
    </>
  )
}

function FilterSidebar({ categories, activeCategory }: { categories: Awaited<ReturnType<typeof listCategories>>; activeCategory?: string }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</p>
        <nav className="space-y-1">
          <Link
            href="/products"
            className={cn(
              'block rounded-md px-3 py-2 text-sm transition-colors',
              !activeCategory ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            All Products
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className={cn(
                'block rounded-md px-3 py-2 text-sm transition-colors',
                activeCategory === c.slug ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold">Need help finding something?</p>
        <p className="mt-1 text-xs text-muted-foreground">Our team can source any hardware product.</p>
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '254787151516'}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#25D366] hover:underline"
        >
          Chat on WhatsApp →
        </a>
      </div>
    </div>
  )
}
