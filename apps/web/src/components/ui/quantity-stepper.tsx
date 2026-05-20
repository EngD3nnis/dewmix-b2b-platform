'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: number
  min?: number
  max?: number
  onChange: (next: number) => void
  size?: 'sm' | 'md'
  disabled?: boolean
}

export function QuantityStepper({ value, min = 0, max = 999, onChange, size = 'md', disabled }: Props) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))
  const dim = size === 'sm' ? 'h-7 w-7 text-sm' : 'h-9 w-9 text-base'

  return (
    <div className={cn('inline-flex items-center rounded-md border bg-background', disabled && 'opacity-50')}>
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className={cn(
          'grid place-items-center rounded-l-md transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40',
          dim
        )}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={cn('grid place-items-center border-x px-3 tabular font-medium', size === 'sm' ? 'h-7 min-w-[2.5rem]' : 'h-9 min-w-[3rem]')}>
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className={cn(
          'grid place-items-center rounded-r-md transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40',
          dim
        )}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
