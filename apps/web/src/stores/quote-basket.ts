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

interface QuoteBasketState {
  items: QuoteItem[]
  referenceNumber: string
  add: (item: Omit<QuoteItem, 'quantity'>, quantity?: number) => void
  update: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
  totalItems: () => number
  generateWhatsAppMessage: (phone: string) => string
}

function generateRef(): string {
  const date = new Date()
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const seq = String(Math.floor(Math.random() * 900) + 100)
  return `DWX-${ymd}-${seq}`
}

export const useQuoteBasket = create<QuoteBasketState>()(
  persist(
    (set, get) => ({
      items: [],
      referenceNumber: generateRef(),

      add: (item, quantity = item.minOrderQty || 1) => {
        const { items } = get()
        const existing = items.find((i) => i.productId === item.productId)
        if (existing) {
          set({ items: items.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i) })
        } else {
          set({ items: [...items, { ...item, quantity }] })
        }
      },

      update: (productId, quantity) => {
        if (quantity <= 0) {
          get().remove(productId)
          return
        }
        set({ items: get().items.map((i) => i.productId === productId ? { ...i, quantity } : i) })
      },

      remove: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),

      clear: () => set({ items: [], referenceNumber: generateRef() }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      generateWhatsAppMessage: () => {
        const { items, referenceNumber } = get()
        if (items.length === 0) return ''

        const lines = [
          `Hello Dewmix Hardware! 🏗️`,
          ``,
          `I would like to request a quote for the following items:`,
          ``,
          `📋 *Quote Reference: ${referenceNumber}*`,
          ``,
          `📦 *Items Requested:*`,
          ...items.map((item, i) => [
            `${i + 1}. ${item.name}`,
            `   SKU: ${item.sku} | Qty: *${item.quantity} ${item.quantity === 1 ? 'unit' : 'units'}*`,
          ]).flat(),
          ``,
          `Please advise on pricing, availability, and delivery options.`,
          ``,
          `Thank you!`,
          `Ref: ${referenceNumber}`,
        ]
        return lines.join('\n')
      },
    }),
    {
      name: 'dewmix-quote-basket',
      // Only persist items and reference, not functions
      partialize: (state) => ({ items: state.items, referenceNumber: state.referenceNumber }),
    }
  )
)

// Convenience selector for the header badge
export const useQuoteCount = () => useQuoteBasket((s) => s.totalItems())
