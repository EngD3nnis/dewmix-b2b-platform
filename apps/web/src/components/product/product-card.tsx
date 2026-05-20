import Image from 'next/image'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AddToQuoteButton } from '@/components/quote/add-to-quote-button'
import { StockBadge } from './stock-badge'
import { cn } from '@/lib/utils'
import type { ProductSummary } from '@dewmix/types'

interface Props {
  product: ProductSummary & { minOrderQty?: number; specs?: Record<string, string> }
  className?: string
  priority?: boolean
}

export function ProductCard({ product, className, priority = false }: Props) {
  const href = `/products/${product.slug}`
  const specEntries = product.specs ? Object.entries(product.specs).slice(0, 2) : []
  const moq = product.minOrderQty ?? 1

  return (
    <article className={cn(
      'group flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg',
      className
    )}>
      {/* Image */}
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary/40">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl} alt={product.name} fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={priority}
              {...(product.imageBlurDataUrl
                ? { placeholder: 'blur' as const, blurDataURL: product.imageBlurDataUrl }
                : {})}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Package className="h-8 w-8 opacity-20" />
            </div>
          )}
          {product.isFeatured && (
            <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              Featured
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5">
        {/* Category + Brand */}
        <div className="flex flex-wrap items-center gap-1.5">
          {product.category && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {product.category.name}
            </span>
          )}
          {product.brand && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                {product.brand.name}
              </span>
            </>
          )}
        </div>

        {/* Name */}
        <Link href={href} className="mt-1.5 block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {/* Specs preview */}
        {specEntries.length > 0 && (
          <dl className="mt-2 space-y-0.5">
            {specEntries.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-2 text-xs">
                <dt className="shrink-0 text-muted-foreground">{k}</dt>
                <dd className="truncate text-right font-medium">{String(v)}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Stock + MOQ */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <StockBadge inStock={product.inStock} />
          {moq > 1 && (
            <span className="text-xs text-muted-foreground">
              MOQ <span className="font-semibold text-foreground">{moq}</span>
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-3">
          <AddToQuoteButton
            product={{
              productId: product.id,
              slug: product.slug,
              sku: product.sku,
              name: product.name,
              imageUrl: product.imageUrl,
              category: product.category?.name ?? '',
              minOrderQty: moq,
            }}
            size="sm"
            className="w-full"
            disabled={!product.inStock}
          />
        </div>
      </div>
    </article>
  )
}
