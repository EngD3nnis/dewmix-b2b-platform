'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Search, Pencil, Trash2, Star, Package, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StockBadge } from '@/components/product/stock-badge'
import { adminApi, type AdminProduct, type AdminCategory } from '@/lib/api/admin'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [, startTransition] = useTransition()

  const load = (q = search, cat = categoryFilter, status = statusFilter, p = page) => {
    setIsLoading(true)
    startTransition(async () => {
      try {
        const data = await adminApi.products.list(q, cat, status, p)
        setProducts(data.items)
        setTotal(data.total)
      } catch {
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    })
  }

  useEffect(() => {
    adminApi.categories.list().then(setCategories).catch(() => {})
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await adminApi.products.delete(id)
    load()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    load(search, categoryFilter, statusFilter, 1)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} products in catalog</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products or SKUs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); load(search, e.target.value, statusFilter, 1) }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); load(search, categoryFilter, e.target.value, 1) }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Package className="mx-auto h-10 w-10 opacity-20" />
            <p className="mt-3">No products found</p>
            <Button asChild className="mt-4" variant="outline" size="sm">
              <Link href="/admin/products/new">Add your first product</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Category</th>
                  <th className="hidden px-4 py-3 text-center font-medium text-muted-foreground md:table-cell">Stock</th>
                  <th className="hidden px-4 py-3 text-center font-medium text-muted-foreground lg:table-cell">MOQ</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-secondary/40">
                          {p.imageUrl ? (
                            <Image src={p.imageUrl} alt={p.name} fill sizes="48px" className="object-cover" />
                          ) : (
                            <div className="grid h-full place-items-center"><Package className="h-5 w-5 text-muted-foreground/30" /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {p.category?.name ?? '—'}
                    </td>
                    <td className="hidden px-4 py-3 text-center md:table-cell">
                      <StockBadge inStock={p.inStock} />
                    </td>
                    <td className="hidden px-4 py-3 text-center text-muted-foreground lg:table-cell">
                      {p.minOrderQty}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={p.status === 'ACTIVE' ? 'success' : p.status === 'DRAFT' ? 'secondary' : 'outline'}
                        className="capitalize"
                      >
                        {p.status.toLowerCase().replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {p.isFeatured && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                          <Link href={`/admin/products/${p.id}`}><Pencil className="h-3.5 w-3.5" /></Link>
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(p.id, p.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 25 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">Showing page {page}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(search, categoryFilter, statusFilter, p) }}>← Prev</Button>
            <Button variant="outline" size="sm" disabled={page * 25 >= total} onClick={() => { const p = page + 1; setPage(p); load(search, categoryFilter, statusFilter, p) }}>Next →</Button>
          </div>
        </div>
      )}
    </div>
  )
}
