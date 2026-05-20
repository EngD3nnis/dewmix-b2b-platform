import type { Paginated, ProductSummary, ProductListQuery } from '@dewmix/types'
import { apiFetch } from './client'

const PRODUCTS_PATH = '/api/v1/products'

/** Build query string from a product list query. */
function buildQuery(query: Partial<ProductListQuery> = {}): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

export async function listProducts(query: Partial<ProductListQuery> = {}) {
  return apiFetch<Paginated<ProductSummary>>(`${PRODUCTS_PATH}${buildQuery(query)}`, {
    next: { revalidate: 60, tags: ['products'] },
  })
}

export async function getProduct(slug: string) {
  return apiFetch<ProductDetail>(`${PRODUCTS_PATH}/${slug}`, {
    next: { revalidate: 300, tags: ['products', `product:${slug}`] },
  })
}

// Type for product detail page — kept loose since the API model is rich.
// In a future iteration, define a ProductDetailSchema in @dewmix/types.
export type ProductDetail = ProductSummary & {
  description: string | null
  images: {
    url: string
    alt: string | null
    width: number | null
    height: number | null
    blurDataUrl: string | null
  }[]
  specs: Record<string, unknown>
  variants: { id: string; name: string; sku: string; priceCents: number | null }[]
}
