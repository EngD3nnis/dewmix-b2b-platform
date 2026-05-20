import Link from 'next/link'
import {
  Drill, Wrench, Brick, PaintBucket, Zap, Droplet, Home, HardHat, Bolt, Settings,
  type LucideIcon,
} from 'lucide-react'
import { listCategories, type CategorySummary } from '@/lib/api/categories'

const ICON_MAP: Record<string, LucideIcon> = {
  Drill, Wrench, Brick, PaintBucket, Zap, Droplet, Home, HardHat, Bolt, Settings,
}

export async function Categories() {
  let categories: CategorySummary[] = []
  try {
    categories = await listCategories()
  } catch {
    // API not available — show nothing, don't crash the homepage
    return null
  }

  if (categories.length === 0) return null

  return (
    <section className="container py-14 lg:py-20">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Shop by category</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">37 categories. 4,000+ products. Find what you need fast.</p>
        </div>
        <Link href="/categories" className="hidden text-sm font-medium text-primary hover:underline sm:inline">
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {categories.slice(0, 10).map((c) => {
          const Icon = c.iconName ? ICON_MAP[c.iconName] ?? Settings : Settings
          return (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center transition-all duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-medium text-foreground">{c.name}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
