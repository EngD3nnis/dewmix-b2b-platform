import Link from 'next/link'
import { FileText, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { env } from '@/env'

export function QuoteCta() {
  return (
    <section className="container py-14 lg:py-16">
      <div className="relative overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground sm:p-12 lg:p-16">
        {/* Decoration */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-black/10 blur-2xl" />

        <div className="relative grid items-center gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              For contractors & businesses
            </div>
            <h2 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
              Building something big?<br className="hidden sm:inline" /> Get a tailored quote.
            </h2>
            <p className="mt-3 max-w-lg text-sm text-primary-foreground/80 sm:text-base">
              Bulk pricing for contractors. Project-based credit terms available. We respond within 24 hours
              with a complete itemized quote.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Button asChild variant="secondary" size="lg">
              <Link href="/quotes/new">
                <FileText className="h-4 w-4" />
                Request a quote
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
              <a href={`https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" />
                WhatsApp us
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
