import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { ProductForm } from '@/components/admin/product-form'
import { env } from '@/env'

type Params = Promise<{ id: string }>

export const metadata = { title: 'Edit Product — Admin' }

async function getData(id: string) {
  const [productRes, categoriesRes] = await Promise.all([
    fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/admin/products/${id}`, { cache: 'no-store' }),
    fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/admin/categories`, { cache: 'no-store' }),
  ])
  if (!productRes.ok) return null
  const [product, categories] = await Promise.all([productRes.json(), categoriesRes.json()])
  return { product, categories }
}

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params
  const data = await getData(id)
  if (!data) notFound()

  const { product, categories } = data
  const inventory = product.inventory?.[0]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="inline h-4 w-4" /> Products
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-display text-xl font-bold truncate max-w-sm">{product.name}</h1>
      </div>

      <ProductForm
        categories={categories}
        mode="edit"
        initialData={{
          id: product.id,
          name: product.name,
          sku: product.sku,
          slug: product.slug,
          shortDescription: product.shortDescription ?? '',
          description: product.description ?? '',
          categoryId: product.category?.id ?? '',
          brandId: product.brand?.id,
          status: product.status,
          isFeatured: product.isFeatured,
          minOrderQty: product.minOrderQty,
          quantity: inventory?.quantity ?? 0,
          specs: (product.specs as Record<string, string>) ?? {},
          images: product.images ?? [],
        }}
      />
    </div>
  )
}
