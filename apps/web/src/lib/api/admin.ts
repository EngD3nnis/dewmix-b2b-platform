import { env } from '@/env'

async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export type AdminProduct = {
  id: string; slug: string; sku: string; name: string; status: string;
  isFeatured: boolean; minOrderQty: number; specs: Record<string, string>;
  inStock: boolean; imageUrl: string | null;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  createdAt: string;
}

export type AdminCategory = {
  id: string; slug: string; name: string; iconName: string | null; isActive: boolean; sortOrder: number;
  _count: { products: number };
}

export type AdminStats = { products: number; categories: number; activeProducts: number; featuredProducts: number }

export const adminApi = {
  stats: () => adminFetch<AdminStats>('/api/v1/admin/stats'),

  products: {
    list: (q?: string, categoryId?: string, status?: string, page = 1) =>
      adminFetch<{ items: AdminProduct[]; total: number; totalPages: number }>(
        `/api/v1/admin/products?page=${page}${q ? `&q=${encodeURIComponent(q)}` : ''}${categoryId ? `&categoryId=${categoryId}` : ''}${status ? `&status=${status}` : ''}`
      ),
    get: (id: string) => adminFetch<AdminProduct & { description: string; images: { id: string; url: string; alt: string | null }[]; inventory: { quantity: number }[] }>(`/api/v1/admin/products/${id}`),
    create: (data: object) => adminFetch('/api/v1/admin/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: object) => adminFetch(`/api/v1/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => adminFetch(`/api/v1/admin/products/${id}`, { method: 'DELETE' }),
    addImage: (
      productId: string,
      data: { url: string; alt?: string; width?: number; height?: number; blurDataUrl?: string },
    ) =>
      adminFetch<{ id: string; url: string; alt: string | null; width: number | null; height: number | null }>(
        `/api/v1/admin/products/${productId}/images`,
        { method: 'POST', body: JSON.stringify(data) },
      ),
    removeImage: (imageId: string) => adminFetch(`/api/v1/admin/images/${imageId}`, { method: 'DELETE' }),
    reorderImages: (productId: string, orderedIds: string[]) =>
      adminFetch(`/api/v1/admin/products/${productId}/images/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ orderedIds }),
      }),
  },

  categories: {
    list: () => adminFetch<AdminCategory[]>('/api/v1/admin/categories'),
    create: (data: object) => adminFetch('/api/v1/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: object) => adminFetch(`/api/v1/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => adminFetch(`/api/v1/admin/categories/${id}`, { method: 'DELETE' }),
  },

  uploads: {
    presign: (filename: string, contentType: string, productId?: string) =>
      adminFetch<{ url: string; publicUrl: string; key: string; expiresIn: number }>(
        '/api/v1/uploads/presign',
        {
          method: 'POST',
          body: JSON.stringify({ filename, contentType, ...(productId ? { productId } : {}) }),
        },
      ),
  },
}
