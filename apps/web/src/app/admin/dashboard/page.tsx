import { redirect } from 'next/navigation'

/**
 * Legacy route. The real admin overview lives at `/admin` — this redirect
 * exists so any old bookmarks, links in docs, or muscle-memory typing of
 * `/admin/dashboard` still land somewhere useful instead of showing a stub.
 */
export default function Page() {
  redirect('/admin')
}
