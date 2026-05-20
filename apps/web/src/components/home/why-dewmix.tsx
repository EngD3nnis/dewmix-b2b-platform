import { ShoppingBag, MessageCircle, CheckCircle, Clock } from 'lucide-react'

const FEATURES = [
  {
    icon: ShoppingBag,
    title: 'Quote basket',
    body: 'Add multiple products, set quantities, and send one structured quote request — not 20 separate messages.',
  },
  {
    icon: MessageCircle,
    title: 'Pre-formatted WhatsApp',
    body: 'Your quote arrives with product names, SKUs, quantities, and a reference number. No back-and-forth to clarify.',
  },
  {
    icon: CheckCircle,
    title: 'Authentic stock',
    body: 'Sourced direct from manufacturers and authorized distributors. What you see is what we have.',
  },
  {
    icon: Clock,
    title: 'Fast response',
    body: 'Our team responds to quote requests within 1 business hour during operating hours.',
  },
]

export function WhyDewmix() {
  return (
    <section className="border-y bg-secondary/30 py-14 lg:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Browse, quote, and get pricing — all through a conversation on WhatsApp.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="group relative rounded-xl border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md">
              <div className="mb-2 text-xs font-bold text-muted-foreground/50">STEP {i + 1}</div>
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
