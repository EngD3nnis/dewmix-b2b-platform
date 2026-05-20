import { env } from '@/env'

type FetchOptions = RequestInit & {
  /** Next.js cache options */
  next?: { revalidate?: number | false; tags?: string[] }
  /** Override base URL */
  baseUrl?: string
}

export class ApiError extends Error {
  constructor(public statusCode: number, message: string, public errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Server-side fetch helper. Always prefixes the API URL and parses JSON.
 * Throws ApiError on non-2xx responses.
 */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = `${options.baseUrl ?? env.NEXT_PUBLIC_API_URL}${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    let body: { message?: string; errors?: Record<string, string[]> } = {}
    try {
      body = await res.json()
    } catch {
      // empty body
    }
    throw new ApiError(res.status, body.message ?? res.statusText, body.errors)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}
