import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-6xl font-bold text-primary sm:text-7xl">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">Page not found</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        We couldn't find what you were looking for. It may have moved or no longer exists.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="h-4 w-4" />
            Home
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/products">
            <Search className="h-4 w-4" />
            Browse products
          </Link>
        </Button>
      </div>
    </div>
  )
}
