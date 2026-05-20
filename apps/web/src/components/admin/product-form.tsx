'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminApi, type AdminCategory } from '@/lib/api/admin'
import { ImageDropzone, type UploadedImage } from './image-dropzone'

interface ProductFormData {
  id?: string
  name: string; sku: string; slug?: string;
  shortDescription: string; description: string;
  categoryId: string; brandId?: string;
  status: string; isFeatured: boolean;
  minOrderQty: number; quantity: number;
  specs: Record<string, string>;
  images: UploadedImage[]
}

interface Props {
  initialData?: Partial<ProductFormData>
  categories: AdminCategory[]
  mode: 'create' | 'edit'
}

export function ProductForm({ initialData, categories, mode }: Props) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<ProductFormData>({
    name: '', sku: '', shortDescription: '', description: '',
    categoryId: '', status: 'ACTIVE', isFeatured: false,
    minOrderQty: 1, quantity: 0, specs: {},
    images: [],
    ...initialData,
  })

  const [specKey, setSpecKey] = useState('')
  const [specVal, setSpecVal] = useState('')

  const set = (k: keyof ProductFormData, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  const addSpec = () => {
    if (!specKey.trim()) return
    set('specs', { ...form.specs, [specKey.trim()]: specVal.trim() })
    setSpecKey(''); setSpecVal('')
  }

  const removeSpec = (key: string) => {
    const next = { ...form.specs }
    delete next[key]
    set('specs', next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      const payload = {
        name: form.name, sku: form.sku,
        shortDescription: form.shortDescription,
        description: form.description,
        categoryId: form.categoryId,
        status: form.status,
        isFeatured: form.isFeatured,
        minOrderQty: form.minOrderQty,
        quantity: form.quantity,
        specs: form.specs,
      }

      if (mode === 'create') {
        const created = await adminApi.products.create(payload) as { id: string }
        router.push(`/admin/products/${created.id}`)
      } else {
        await adminApi.products.update(initialData!.id!, payload)
        router.refresh()
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Basic info */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Product name *</span>
            <Input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Bosch GSB 13 RE Impact Drill" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">SKU *</span>
            <Input required value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="BSH-GSB13RE" />
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Short description</span>
          <Input value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} placeholder="One-line product summary" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Full description</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Detailed product description..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      {/* Category + status */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Classification</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Category *</span>
            <select
              required
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Status</span>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Min. Order Qty</span>
            <Input type="number" min={1} value={form.minOrderQty} onChange={(e) => set('minOrderQty', parseInt(e.target.value) || 1)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Stock quantity</span>
            <Input type="number" min={0} value={form.quantity} onChange={(e) => set('quantity', parseInt(e.target.value) || 0)} />
          </label>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
          <span className="text-sm font-medium">Feature on homepage</span>
        </label>
      </div>

      {/* Specifications */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Specifications</h2>
        {Object.entries(form.specs).length > 0 && (
          <div className="space-y-2">
            {Object.entries(form.specs).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 rounded-md border bg-secondary/30 px-3 py-2">
                <span className="min-w-0 flex-1 text-sm font-medium">{k}</span>
                <span className="min-w-0 flex-1 text-sm text-muted-foreground">{v}</span>
                <button type="button" onClick={() => removeSpec(k)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input placeholder="Key (e.g. Power)" value={specKey} onChange={(e) => setSpecKey(e.target.value)} className="flex-1" />
          <Input placeholder="Value (e.g. 600W)" value={specVal} onChange={(e) => setSpecVal(e.target.value)} className="flex-1" />
          <Button type="button" variant="outline" onClick={addSpec}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Images */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Images</h2>
          {mode === 'create' && (
            <p className="text-xs text-muted-foreground">Save the product first to upload images</p>
          )}
        </div>

        {mode === 'edit' && initialData?.id ? (
          <ImageDropzone
            productId={initialData.id}
            images={form.images}
            onChange={(next) => set('images', next)}
            productName={form.name}
          />
        ) : (
          <div className="rounded-lg border-2 border-dashed bg-secondary/20 px-4 py-8 text-center text-sm text-muted-foreground">
            Image upload becomes available after you save the product for the first time.
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Product' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
