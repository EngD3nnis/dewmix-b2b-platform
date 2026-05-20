import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

interface Props {
  title: string
  /** Optional one-line tagline shown under the title. */
  tagline?: string
  children: React.ReactNode
}

/**
 * Standard layout for static informational pages (about, delivery, help,
 * privacy, terms). Centred column, prose-styled body, WhatsApp footer CTA.
 */
export function InfoPage({ title, tagline, children }: Props) {
  return (
    <div className="container max-w-3xl py-12 sm:py-16">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {tagline && <p className="mt-3 text-lg text-muted-foreground">{tagline}</p>}
      </header>

      <div className="space-y-5 text-[15px] leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:my-3 [&_ul]:my-3 [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:list-disc">
        {children}
      </div>

      <div className="mt-12 flex flex-col gap-3 rounded-xl border bg-secondary/30 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Have a question we didn't cover?</p>
          <p className="text-sm text-muted-foreground">We respond fastest on WhatsApp.</p>
        </div>
        <Link href="https://wa.me/254787151516" target="_blank" rel="noreferrer">
          <Button>
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
            Chat on WhatsApp
          </Button>
        </Link>
      </div>
    </div>
  )
}
