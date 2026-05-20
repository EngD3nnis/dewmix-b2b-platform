import { InfoPage } from '@/components/shared/info-page'

export const metadata = {
  title: 'Delivery — Dewmix Hardware',
  description: 'Delivery options, lead times, and pickup arrangements for orders from Dewmix Hardware.',
}

export default function DeliveryPage() {
  return (
    <InfoPage title="Delivery" tagline="Pickup from Kenol Road or arranged delivery on request.">
      <h2>Pickup</h2>
      <p>
        You're welcome to pick up directly from our Kenol Road yard during business hours.
        Once your order is confirmed on WhatsApp, we'll have it ready for collection.
      </p>

      <h2>Delivery</h2>
      <p>
        We arrange delivery for large orders (cement, steel, mabati, paint by the drum) across
        Kenya. Delivery cost depends on volume, weight, and destination — we'll quote it together
        with your order on WhatsApp.
      </p>

      <h2>Lead times</h2>
      <ul>
        <li>In-stock items: usually same day or next day for local destinations.</li>
        <li>Larger volumes: 2–4 business days depending on logistics.</li>
        <li>Special orders (specific brand, size, or finish not in regular stock): we'll confirm a date when you ask.</li>
      </ul>

      <h2>How to arrange</h2>
      <p>
        Send your list of items on WhatsApp — the easiest way is to use the "Add to Quote" button
        on each product and then send the whole basket in one message. We reply with pricing,
        availability, and a delivery quote.
      </p>
    </InfoPage>
  )
}
