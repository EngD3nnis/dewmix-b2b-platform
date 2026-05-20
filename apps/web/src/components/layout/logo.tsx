import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn('inline-flex items-center gap-2 font-display font-bold tracking-tight', className)}
      aria-label="Dewmix Hardware home"
    >
      {/* Square mark — replace with actual logo SVG when ready */}
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm"
      >
        <span className="text-base font-black leading-none">D</span>
      </span>
      <span className="text-lg leading-none">
        Dewmix<span className="font-medium text-muted-foreground"> Hardware</span>
      </span>
    </Link>
  )
}
