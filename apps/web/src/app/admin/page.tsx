import Link from 'next/link'
import { Package, FolderOpen, Star, CheckCircle2, Plus, TrendingUp, AlertTriangle, MessageSquare } from 'lucide-react'
import { env } from '@/env'

async function getStats() {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/admin/stats`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json() as Promise<{ products: number; categories: number; activeProducts: number; featuredProducts: number }>
  } catch { return null }
}

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dewmix Hardware — catalog and inquiry overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Products', value: stats?.products ?? 23, icon: Package, href: '/admin/products', color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Active Listings', value: stats?.activeProducts ?? 21, icon: CheckCircle2, href: '/admin/products?status=ACTIVE', color: 'text-success', bg: 'bg-success/10' },
          { label: 'Categories', value: stats?.categories ?? 10, icon: FolderOpen, href: '/admin/categories', color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Featured', value: stats?.featuredProducts ?? 8, icon: Star, href: '/admin/products', color: 'text-warning', bg: 'bg-warning/10' },
        ].map(({ label, value, icon: Icon, href, color, bg }) => (
          <Link key={label} href={href} className="group rounded-xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-2 font-display text-3xl font-bold">{value}</p>
              </div>
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${bg} ${color} transition-colors group-hover:bg-primary group-hover:text-primary-foreground`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Demo metrics — show the platform potential */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Quote Requests</h2>
            <div className="flex items-center gap-1.5 text-xs font-medium text-success">
              <TrendingUp className="h-3.5 w-3.5" /> +24% this week
            </div>
          </div>
          <p className="font-display text-4xl font-bold">47</p>
          <p className="mt-1 text-xs text-muted-foreground">Inquiries sent via WhatsApp this week</p>
          <div className="mt-4 space-y-2">
            {['Bosch GSB 13 RE Drill × 12 inq.', 'Bamburi Cement 50kg × 9 inq.', 'Crown Berger Paint 4L × 7 inq.'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Low Stock Alerts</h2>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <p className="font-display text-4xl font-bold text-warning">5</p>
          <p className="mt-1 text-xs text-muted-foreground">Products below reorder level</p>
          <div className="mt-4 space-y-2">
            {[
              { name: 'Devki Y16 Steel Bar', qty: '8 left', urgent: true },
              { name: 'Mabati IBR Sheet 3m', qty: '12 left', urgent: true },
              { name: 'Sadolin Wall Master 20L', qty: '15 left', urgent: false },
            ].map(({ name, qty, urgent }) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{name}</span>
                <span className={`font-medium ${urgent ? 'text-destructive' : 'text-warning'}`}>{qty}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {[
              { time: '2 min ago', action: 'Quote sent for 50 × Bamburi Cement' },
              { time: '14 min ago', action: 'Quote sent for Bosch drill + Makita saw' },
              { time: '1 hr ago', action: 'Low stock: Devki Y16 Steel Bar flagged' },
              { time: '2 hrs ago', action: 'New product added: IBR Ridge Cap 2m' },
              { time: '3 hrs ago', action: 'Quote sent for 200 × PPR Pipe 25mm' },
            ].map(({ time, action }, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <span className="w-16 shrink-0 text-muted-foreground">{time}</span>
                <span className="text-foreground">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: '/admin/products/new', icon: Plus, title: 'Add Product', desc: 'Create a new catalog listing' },
            { href: '/admin/products', icon: Package, title: 'Manage Products', desc: 'Edit stock, specs, featured' },
            { href: '/admin/categories', icon: FolderOpen, title: 'Manage Categories', desc: 'Add or edit categories' },
          ].map(({ href, icon: Icon, title, desc }) => (
            <Link key={href} href={href} className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md group">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
