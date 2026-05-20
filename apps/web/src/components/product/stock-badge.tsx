import { cn } from '@/lib/utils'

interface Props {
  inStock: boolean
  className?: string
  size?: 'sm' | 'md'
}

export function StockBadge({ inStock, className, size = 'sm' }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        inStock
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-destructive/30 bg-destructive/10 text-destructive',
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', inStock ? 'bg-success' : 'bg-destructive')} />
      {inStock ? 'In Stock' : 'Out of Stock'}
    </span>
  )
}
