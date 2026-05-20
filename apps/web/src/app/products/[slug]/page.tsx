import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Package, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddToQuoteButton } from '@/components/quote/add-to-quote-button'
import { TrackedWhatsAppLink } from '@/components/product/tracked-whatsapp-link'
import { StockBadge } from '@/components/product/stock-badge'
import { getProduct } from '@/lib/api/products'
import { env } from '@/env'
import type { Metadata } from 'next'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  try {
    const p = await getProduct(slug)
    return {
      title: p.name,
      description: p.shortDescription ?? `${p.name} — available from Dewmix Hardware, Kenol Road, Kenya.`,
      openGraph: { images: p.images[0] ? [{ url: p.images[0].url }] : [] },
    }
  } catch { return { title: 'Product not found' } }
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params
  let product: Awaited<ReturnType<typeof getProduct>>
  try { product = await getProduct(slug) } catch { notFound() }

  const totalAvailable = (product as any).inventory?.reduce(
    (s: number, i: { quantity: number; reserved: number }) => s + (i.quantity - i.reserved), 0
  ) ?? 0
  const inStock = totalAvailable > 0
  const specs = (product.specs ?? {}) as Record<string, string>
  const specEntries = Object.entries(specs)
  const moq = (product as any).minOrderQty ?? 1

  const quoteProduct = {
    productId: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    imageUrl: (product.images[0]?.url ?? null),
    category: product.category?.name ?? '',
    minOrderQty: moq,
  }

  return (
    <div className="container py-6 lg:py-10">
      {/* Breadcrumb */}
      <nav className="mb-5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:text-foreground">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border bg-secondary/40">
            {product.images[0] ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt ?? product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                {...(product.images[0].blurDataUrl
                  ? { placeholder: 'blur' as const, blurDataURL: product.images[0].blurDataUrl }
                  : {})}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <Package className="h-14 w-14 opacity-20" />
                <p className="text-sm">No image available</p>
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {product.images.slice(0, 5).map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg border bg-secondary/40">
                  <Image src={img.url} alt={img.alt ?? ''} fill sizes="100px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.brand && (
            <Link href={`/products?brand=${product.brand.slug}`}
              className="text-xs font-bold uppercase tracking-widest text-primary hover:underline">
              {product.brand.name}
            </Link>
          )}
          <h1 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">{product.name}</h1>
          <p className="mt-1.5 font-mono text-xs text-muted-foreground">SKU: {product.sku}</p>

          {product.category && (
            <div className="mt-2">
              <Link href={`/categories/${product.category.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border bg-secondary px-3 py-1 text-xs font-medium hover:border-primary/30">
                {product.category.name}
              </Link>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <StockBadge inStock={inStock} size="md" />
            {moq > 1 && (
              <span className="rounded-full border bg-secondary px-3 py-1 text-sm">
                Min. order: <span className="font-semibold">{moq} units</span>
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          {/* Primary CTA — Add to Quote Basket */}
          <div className="mt-6 space-y-3">
            <AddToQuoteButton
              product={quoteProduct}
              size="lg"
              className="w-full"
              disabled={!inStock}
              label="Add to Quote Basket"
            />
            <div className="flex gap-2">
              <TrackedWhatsAppLink
                productId={product.id}
                productName={product.name}
                productSku={product.sku}
                className="flex-1"
              />
              <a href={`tel:${env.NEXT_PUBLIC_CONTACT_PHONE}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Call us
                </Button>
              </a>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Add to basket to build a multi-item quote, or inquire directly via WhatsApp.
            </p>
          </div>

          {/* Specs */}
          {specEntries.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Specifications</h2>
              <dl className="divide-y rounded-xl border bg-card overflow-hidden">
                {specEntries.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                    <dt className="shrink-0 text-sm text-muted-foreground">{k}</dt>
                    <dd className="text-right text-sm font-medium">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Sticky mobile bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="container">
          <AddToQuoteButton
            product={quoteProduct}
            size="lg"
            className="w-full"
            disabled={!inStock}
            label="Add to Quote Basket"
          />
        </div>
      </div>
    </div>
  )
}
