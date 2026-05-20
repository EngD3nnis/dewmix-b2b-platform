import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ProductForm } from '@/components/admin/product-form'
import { adminApi } from '@/lib/api/admin'
import { env } from '@/env'

export const metadata = { title: 'New Product — Admin' }

async function getCategories() {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/admin/categories`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function NewProductPage() {
  const categories = await getCategories()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="inline h-4 w-4" /> Products
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-display text-xl font-bold">New Product</h1>
      </div>
      <ProductForm categories={categories} mode="create" />
    </div>
  )
}
