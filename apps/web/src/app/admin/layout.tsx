import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/session'
import { Logo } from '@/components/layout/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  LayoutDashboard, Package, FolderOpen, LogOut, MessageCircle,
  Menu, BarChart2,
} from 'lucide-react'
import { logout } from '@/lib/auth/actions'

const NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/categories', icon: FolderOpen, label: 'Categories' },
  { href: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/admin/inquiries', icon: MessageCircle, label: 'Inquiries' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin')
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') redirect('/')

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center border-b px-5">
          <Logo />
        </div>

        <div className="flex flex-1 flex-col justify-between p-3">
          <nav className="space-y-1">
            {NAV.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="space-y-3 border-t pt-3">
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-foreground">{user.firstName ?? 'Admin'}</p>
              <p className="text-xs text-muted-foreground">{user.phone}</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:h-16 lg:px-6">
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-md p-1.5 hover:bg-accent lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-muted-foreground lg:hidden">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" target="_blank" className="rounded-md border bg-background px-3 py-1.5 text-xs hover:border-primary/30">
              View site ↗
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
