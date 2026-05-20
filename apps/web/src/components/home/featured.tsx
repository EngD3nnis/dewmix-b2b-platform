import Link from 'next/link'
import { listProducts } from '@/lib/api/products'
import { ProductCard } from '@/components/product/product-card'
import type { ProductSummary } from '@dewmix/types'

export async function Featured() {
  let products: ProductSummary[] = []
  try {
    const res = await listProducts({ featured: true, pageSize: 8, sort: 'popularity' })
    products = res.items
  } catch {
    return null
  }

  if (products.length === 0) return null

  return (
    <section className="container py-14 lg:py-20">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Featured products</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Hand-picked picks from our top brands.</p>
        </div>
        <Link href="/products" className="hidden text-sm font-medium text-primary hover:underline sm:inline">
          See all →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
      </div>

      <div className="mt-8 text-center sm:hidden">
        <Link
          href="/products"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          See all products →
        </Link>
      </div>
    </section>
  )
}
