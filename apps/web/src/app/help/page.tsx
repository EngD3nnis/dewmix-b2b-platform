import { InfoPage } from '@/components/shared/info-page'

export const metadata = {
  title: 'Help — Dewmix Hardware',
  description: 'Quick answers to common questions about ordering, delivery, and account use at Dewmix Hardware.',
}

export default function HelpPage() {
  return (
    <InfoPage title="Help & FAQ">
      <h2>How do I order?</h2>
      <p>
        Browse the catalog, tap "Add to Quote" on each item you want, then open your quote
        basket and tap "Send via WhatsApp." We reply with pricing and delivery options.
      </p>

      <h2>Why don't I see prices on the products?</h2>
      <p>
        Hardware pricing changes with quantity, customer relationship, market rates, and
        delivery. We quote per inquiry so you get an accurate, up-to-date number for your
        specific order — not a stale shelf price.
      </p>

      <h2>Can I order without an account?</h2>
      <p>
        Yes. The "Add to Quote" and "Inquire on WhatsApp" buttons work without signing in.
        Sign-in only unlocks saved items and order history (coming soon).
      </p>

      <h2>Do you stock a brand I don't see here?</h2>
      <p>
        Likely yes — we stock more than what's displayed. Ask us on WhatsApp.
      </p>

      <h2>What hours are you open?</h2>
      <p>
        Monday to Saturday, 7:30 AM to 5:30 PM. WhatsApp messages outside business hours are
        replied to first thing the next morning.
      </p>

      <h2>I have a problem with an order</h2>
      <p>
        Message us on WhatsApp with your inquiry reference (it looks like <code>DWX-20260520-1234</code>)
        and we'll sort it.
      </p>
    </InfoPage>
  )
}
