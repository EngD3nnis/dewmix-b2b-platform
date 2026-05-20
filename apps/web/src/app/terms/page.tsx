import { InfoPage } from '@/components/shared/info-page'

export const metadata = {
  title: 'Terms of Use — Dewmix Hardware',
  description: 'The terms that apply when you use the Dewmix Hardware website and inquiry service.',
}

export default function TermsPage() {
  return (
    <InfoPage title="Terms of Use" tagline="Last updated: May 2026.">
      <p>
        These terms apply when you use the Dewmix Hardware website to browse our catalog and
        send inquiries. By using the site you accept these terms.
      </p>

      <h2>The catalog is not a binding offer</h2>
      <p>
        Products shown on this site reflect what we typically stock, but availability,
        specifications, and pricing are confirmed per inquiry on WhatsApp. Nothing on this site
        constitutes a contract until we've confirmed your order in writing.
      </p>

      <h2>Quote requests</h2>
      <p>
        When you send a quote via WhatsApp, you're starting a conversation, not placing an order.
        An order exists once we've confirmed quantity, price, and delivery and you've confirmed
        you want to proceed.
      </p>

      <h2>Product information</h2>
      <p>
        We work to keep product names, specifications, and images accurate, but errors happen.
        If a listed specification differs from the physical product, we'll either match the
        listed spec or refund/exchange — your choice.
      </p>

      <h2>Use of the site</h2>
      <p>
        Don't try to break or overload the site, don't scrape it for commercial purposes, and
        don't pretend to be us. These are reasonable defaults and apply to everyone.
      </p>

      <h2>Liability</h2>
      <p>
        We provide this catalog as-is. We do our best to keep it accurate and online but make no
        warranty that the site will be available 100% of the time. For anything material to a
        purchase decision, please confirm on WhatsApp.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms occasionally. The "Last updated" date at the top of this page
        always reflects the current version.
      </p>

      <h2>Contact</h2>
      <p>
        Dewmix Hardware, Kenol Road, Kenya. Phone <a className="text-primary hover:underline" href="tel:0787151516">0787151516</a>,
        WhatsApp <a className="text-primary hover:underline" href="https://wa.me/254787151516" target="_blank" rel="noreferrer">+254787151516</a>.
      </p>
    </InfoPage>
  )
}
