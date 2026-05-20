'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // TODO: ship to Sentry
    // eslint-disable-next-line no-console
    console.error(error)
  }, [error])

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold sm:text-3xl">Something went wrong</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        We hit a snag loading this page. Our team has been notified — please try again.
      </p>
      <Button onClick={reset} size="lg" className="mt-8">
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}
