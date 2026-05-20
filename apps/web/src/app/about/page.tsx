import { InfoPage } from '@/components/shared/info-page'

export const metadata = {
  title: 'About Dewmix Hardware',
  description: 'A trusted hardware and construction materials supplier serving contractors, builders, and businesses across Kenya from Kenol Road.',
}

export default function AboutPage() {
  return (
    <InfoPage title="About Dewmix Hardware" tagline="Trusted hardware, straight from Kenol Road.">
      <p>
        Dewmix Hardware is a supplier of building materials, power tools, paints, steel, cement,
        and roofing products serving contractors, developers, and construction businesses across
        Kenya. We stock the brands the trade actually uses — Bamburi, Devki, Mabati Rolling
        Mills, Bosch, Makita, DeWalt, Crown Berger, Sadolin, Dulux — and we price for volume.
      </p>

      <h2>What we do</h2>
      <p>
        This catalog is the fastest way to see what we have on hand. Browse, filter by category,
        check stock, then send an inquiry on WhatsApp. We respond with pricing and delivery
        options within business hours. No accounts, no checkout, no waiting on hold.
      </p>

      <h2>Why WhatsApp?</h2>
      <p>
        Construction work moves fast and changes by the hour. A WhatsApp thread lets us send
        photos, confirm specs, adjust quantities, and arrange delivery in real time —
        exactly how our customers already work with their teams and suppliers.
      </p>

      <h2>Where we are</h2>
      <p>
        Kenol Road, Kenya. Call <a className="text-primary hover:underline" href="tel:0787151516">0787151516</a> or
        message us on WhatsApp to schedule a pickup or arrange delivery.
      </p>
    </InfoPage>
  )
}
