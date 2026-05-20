import { apiFetch } from './client'

export type CategorySummary = {
  id: string
  slug: string
  name: string
  iconName: string | null
  imageUrl: string | null
  parentId: string | null
}

export async function listCategories() {
  return apiFetch<CategorySummary[]>('/api/v1/categories', {
    next: { revalidate: 300, tags: ['categories'] },
  })
}
