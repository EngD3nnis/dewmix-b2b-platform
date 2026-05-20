import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, Heart, FileText, LogOut, Phone, MapPin, ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/session'
import { logout } from '@/lib/auth/actions'
import { formatPhoneDisplay } from '@dewmix/utils'

export const metadata = { title: 'My Account' }

const SECTIONS = [
  { href: '/account/quotes', icon: FileText, title: 'My Quotes', description: 'Quote requests sent via WhatsApp' },
  { href: '/account/saved', icon: Heart, title: 'Saved Items', description: 'Products you wishlisted' },
  { href: '/account/addresses', icon: MapPin, title: 'Addresses', description: 'Delivery addresses for inquiries' },
  { href: '/account/profile', icon: User, title: 'Profile', description: 'Name, email, and preferences' },
]

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || formatPhoneDisplay(user.phone ?? '') || 'Welcome'

  return (
    <div className="container py-8 lg:py-12">
      {/* Header card */}
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="bg-gradient-to-br from-primary/10 via-card to-card p-6 lg:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {displayName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">My account</p>
              <h1 className="mt-0.5 font-display text-xl font-bold sm:text-2xl">{displayName}</h1>
              {user.phone && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {formatPhoneDisplay(user.phone)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{title}</p>
              <p className="truncate text-sm text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      {/* Admin shortcut */}
      {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium">Staff access</p>
          <p className="mt-1 text-sm text-muted-foreground">You have admin privileges.</p>
          <Link
            href="/admin"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Open admin dashboard <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Logout */}
      <form action={logout} className="mt-8">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </form>
    </div>
  )
}
