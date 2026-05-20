import { InfoPage } from '@/components/shared/info-page'

export const metadata = {
  title: 'Privacy Policy — Dewmix Hardware',
  description: 'How Dewmix Hardware collects, uses, and protects your information.',
}

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy" tagline="Last updated: May 2026.">
      <p>
        This is a short and honest summary of how we handle your information. If you have
        questions about anything below, please message us on WhatsApp.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>What you tell us:</strong> when you sign in or send a quote inquiry, we collect
          your phone number and (if provided) your name. We use this to contact you about your
          order.
        </li>
        <li>
          <strong>Anonymous analytics:</strong> when you tap "Order via WhatsApp" or add a product
          to your basket, we record which product you were interested in. We do not record who
          you are. IP addresses are hashed daily and discarded.
        </li>
        <li>
          <strong>Standard server logs:</strong> the usual things every website logs (timestamps,
          pages visited, errors) for short retention to keep the site working.
        </li>
      </ul>

      <h2>What we don't do</h2>
      <ul>
        <li>Sell your data. Ever.</li>
        <li>Share it with advertisers.</li>
        <li>Use third-party tracking cookies.</li>
        <li>Profile you or target you with ads.</li>
      </ul>

      <h2>Who we share with</h2>
      <p>
        Phone numbers you give us go to our SMS provider (Africa's Talking) only to deliver the
        message you triggered. Your WhatsApp conversations live in Meta's systems — that's between
        you and them, not us.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us to delete your information at any time by messaging us on WhatsApp with
        the phone number on file.
      </p>

      <h2>Contact</h2>
      <p>
        Dewmix Hardware, Kenol Road, Kenya. Phone: <a className="text-primary hover:underline" href="tel:0787151516">0787151516</a>.
      </p>
    </InfoPage>
  )
}
