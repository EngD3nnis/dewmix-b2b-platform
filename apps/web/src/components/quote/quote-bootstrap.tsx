'use client'

import { useEffect } from 'react'
import { useQuoteStore } from '@/stores/quote'

/** Hydrate the persisted quote store from localStorage on first render. */
export function QuoteBootstrap() {
  useEffect(() => {
    useQuoteStore.persist.rehydrate()
  }, [])
  return null
}
