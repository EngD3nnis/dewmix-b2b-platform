'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface QuoteItem {
  productId: string
  slug: string
  sku: string
  name: string
  imageUrl: string | null
  category: string | null
  quantity: number
  minOrderQty: number
}

interface QuoteStore {
  items: QuoteItem[]
  referenceNumber: string
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  add: (item: Omit<QuoteItem, 'quantity'>, quantity?: number) => void
  update: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
  count: () => number
  totalUnits: () => number
}

/**
 * Generate a quote reference like `DWX-20260519-4821`.
 * Date + 4-digit random suffix gives ~99% uniqueness for the volume
 * a single supplier will ever produce in one day. The reference is
 * purely a customer-facing string; the API does not enforce uniqueness.
 */
function generateRef(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `DWX-${dateStr}-${rand}`
}

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      items: [],
      referenceNumber: generateRef(),
      isOpen: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      add: (item, quantity) => {
        const moq = Math.max(1, item.minOrderQty || 1)
        const qty = quantity ?? moq
        const existing = get().items.find((i) => i.productId === item.productId)
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + qty }
                : i
            ),
            isOpen: true,
          }))
        } else {
          set((s) => ({
            items: [...s.items, { ...item, quantity: qty }],
            isOpen: true,
          }))
        }
      },

      update: (productId, quantity) => {
        if (quantity <= 0) {
          get().remove(productId)
          return
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }))
      },

      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),

      // Clearing also rotates the reference so the next quote isn't confused with the last.
      clear: () => set({ items: [], referenceNumber: generateRef() }),

      count: () => get().items.length,
      totalUnits: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'dewmix-quote-basket',
      // Persist only state, not actions. Persist the reference number so the
      // customer sees the same DWX-YYYYMMDD-XXXX string across reloads.
      partialize: (state) => ({
        items: state.items,
        referenceNumber: state.referenceNumber,
      }),
      // Hydrate manually via <QuoteBootstrap /> to avoid SSR mismatch.
      skipHydration: true,
    }
  )
)

export const useQuoteCount = () => useQuoteStore((s) => s.items.length)
