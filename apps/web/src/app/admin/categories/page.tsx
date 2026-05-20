'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminApi, type AdminCategory } from '@/lib/api/admin'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // New category form
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const load = () => {
    setIsLoading(true)
    adminApi.categories.list().then(setCategories).catch(() => setCategories([])).finally(() => setIsLoading(false))
  }
  useEffect(load, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newSlug) return
    setIsSaving(true)
    setError(null)
    try {
      await adminApi.categories.create({ name: newName, slug: newSlug.toLowerCase().replace(/\s+/g, '-'), iconName: newIcon || undefined })
      setNewName(''); setNewSlug(''); setNewIcon('')
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActive = async (c: AdminCategory) => {
    await adminApi.categories.update(c.id, { isActive: !c.isActive })
    load()
  }

  const handleDelete = async (c: AdminCategory) => {
    if (c._count.products > 0) {
      alert(`Cannot delete — ${c._count.products} products are in this category.`)
      return
    }
    if (!confirm(`Delete category "${c.name}"?`)) return
    await adminApi.categories.delete(c.id)
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">{categories.length} categories</p>
      </div>

      {/* Add new category */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-semibold">Add Category</h2>
        {error && <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
        <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row">
          <Input required placeholder="Name (e.g. Power Tools)" value={newName} onChange={(e) => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')) }} />
          <Input required placeholder="Slug (e.g. power-tools)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
          <Input placeholder="Icon (e.g. Drill)" value={newIcon} onChange={(e) => setNewIcon(e.target.value)} />
          <Button type="submit" disabled={isSaving} className="shrink-0">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </form>
      </div>

      {/* Category list */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Products</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Active</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{c._count.products}</td>
                  <td className="px-4 py-3 text-center">
                    <button type="button" onClick={() => toggleActive(c)}>
                      {c.isActive
                        ? <CheckCircle2 className="mx-auto h-5 w-5 text-success" />
                        : <XCircle className="mx-auto h-5 w-5 text-muted-foreground" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(c)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
