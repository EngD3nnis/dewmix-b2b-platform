import Link from 'next/link'
import {
  Drill, Wrench, Brick, PaintBucket, Zap, Droplet, Home, HardHat, Bolt, Settings,
  type LucideIcon,
} from 'lucide-react'
import { listCategories, type CategorySummary } from '@/lib/api/categories'

const ICON_MAP: Record<string, LucideIcon> = {
  Drill, Wrench, Brick, PaintBucket, Zap, Droplet, Home, HardHat, Bolt, Settings,
}

export const metadata = {
  title: 'All Categories',
  description: 'Browse every category at Dewmix Hardware.',
}

export default async function CategoriesPage() {
  let categories: CategorySummary[] = []
  try {
    categories = await listCategories()
  } catch {
    categories = []
  }

  return (
    <div className="container py-8 lg:py-12">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">All categories</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {categories.length} categories. Find what you need.
      </p>

      {categories.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-card py-16 text-center text-muted-foreground">
          No categories yet. Run <code className="rounded bg-muted px-1.5 py-0.5">pnpm db:seed</code> to load demo data.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {categories.map((c) => {
            const Icon = c.iconName ? ICON_MAP[c.iconName] ?? Settings : Settings
            return (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <span className="text-sm font-medium">{c.name}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
