import { cookies } from 'next/headers'
import { cache } from 'react'
import { env } from '@/env'

export type SessionUser = {
  id: string
  phone: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  role: 'CUSTOMER' | 'SUPPLIER' | 'ADMIN' | 'SUPER_ADMIN' | 'WAREHOUSE_STAFF' | 'FINANCE'
  status: string
}

/**
 * Get the current user from the API using the access cookie.
 * Cached per request via React's `cache()` — multiple components can call this without re-fetching.
 * Returns null if the user is not logged in.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  if (!cookieHeader) return null

  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as SessionUser
  } catch {
    return null
  }
})
