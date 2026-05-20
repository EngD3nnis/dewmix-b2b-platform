import { redirect } from 'next/navigation'

type SearchParams = Promise<{ q?: string }>

/**
 * Until Typesense is wired up, redirect search queries to the products page
 * which already supports a `?q=` filter via the database fallback search.
 */
export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams
  if (q) redirect(`/products?q=${encodeURIComponent(q)}`)
  redirect('/products')
}
