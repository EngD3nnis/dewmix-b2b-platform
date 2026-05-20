import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Construction, ArrowLeft } from 'lucide-react'

interface Props {
  title: string
  description?: string
}

export function ComingSoon({ title, description }: Props) {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
        <Construction className="h-7 w-7" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        {description ?? "We're building this. Check back soon."}
      </p>
      <Button asChild size="lg" className="mt-8" variant="outline">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </Button>
    </div>
  )
}
