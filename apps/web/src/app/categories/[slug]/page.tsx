import { Suspense } from 'react'
import { listProducts } from '@/lib/api/products'
import { ProductCard } from '@/components/product/product-card'
import { ProductGridSkeleton } from '@/components/product/product-card-skeleton'
import type { Metadata } from 'next'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const name = slug
    .split('-')
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join(' ')
  return {
    title: name,
    description: `Shop ${name.toLowerCase()} from Dewmix Hardware. Authentic stock, country-wide delivery, M-Pesa accepted.`,
  }
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params
  const name = slug
    .split('-')
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join(' ')

  return (
    <div className="container py-8 lg:py-12">
      <nav className="mb-4 text-xs text-muted-foreground">
        <a href="/" className="hover:text-foreground">
          Home
        </a>{' '}
        / <a href="/categories" className="hover:text-foreground">Categories</a> / <span className="text-foreground">{name}</span>
      </nav>

      <h1 className="font-display text-2xl font-bold sm:text-3xl">{name}</h1>

      <div className="mt-6 lg:mt-8">
        <Suspense fallback={<ProductGridSkeleton count={12} />}>
          <CategoryGrid slug={slug} />
        </Suspense>
      </div>
    </div>
  )
}

async function CategoryGrid({ slug }: { slug: string }) {
  let data
  try {
    data = await listProducts({ category: slug, pageSize: 24, sort: 'popularity' })
  } catch {
    return (
      <div className="rounded-xl border bg-card py-16 text-center text-muted-foreground">
        Couldn't load products.
      </div>
    )
  }

  if (data.items.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-16 text-center text-muted-foreground">
        No products in this category yet.
      </div>
    )
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">{data.total} products</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
        {data.items.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
      </div>
    </>
  )
}
