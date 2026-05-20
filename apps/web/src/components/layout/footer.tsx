import Link from 'next/link'
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react'
import { Logo } from './logo'
import { env } from '@/env'

const LINK_GROUPS = [
  {
    title: 'Shop',
    links: [
      { href: '/categories/power-tools', label: 'Power Tools' },
      { href: '/categories/hand-tools', label: 'Hand Tools' },
      { href: '/categories/building-materials', label: 'Building Materials' },
      { href: '/categories/paint-coatings', label: 'Paint & Coatings' },
      { href: '/categories/electrical', label: 'Electrical' },
      { href: '/categories/plumbing', label: 'Plumbing' },
    ],
  },
  {
    title: 'Customer',
    links: [
      { href: '/account', label: 'My Account' },
      { href: '/quotes/new', label: 'Request Quote' },
      { href: '/delivery', label: 'Delivery Info' },
      { href: '/help', label: 'Help Center' },
    ],
  },
  {
    title: 'Business',
    links: [
      { href: '/about', label: 'About Dewmix' },
      { href: '/suppliers', label: 'Become a Supplier' },
      { href: '/bulk-orders', label: 'Bulk Orders' },
      { href: '/contractor-program', label: 'Contractor Program' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-20 border-t bg-secondary/30">
      <div className="container py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Kenya's modern hardware store. Authentic tools, construction materials, and supplies delivered to
              your site.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{env.NEXT_PUBLIC_BUSINESS_ADDRESS}</span>
              </li>
              <li>
                <a href={`tel:${env.NEXT_PUBLIC_CONTACT_PHONE}`} className="flex items-start gap-2.5 hover:text-primary">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{env.NEXT_PUBLIC_CONTACT_PHONE}</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2.5 hover:text-primary"
                >
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Chat on WhatsApp</span>
                </a>
              </li>
              <li>
                <a href="mailto:hello@dewmix.co.ke" className="flex items-start gap-2.5 hover:text-primary">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>hello@dewmix.co.ke</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-8 lg:grid-cols-3">
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <h4 className="text-sm font-semibold">{group.title}</h4>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {group.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Dewmix Hardware Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1">
              <span className="font-semibold text-success">M-PESA</span>
              <span className="text-muted-foreground">accepted</span>
            </span>
            <span className="hidden sm:inline">Made in Kenya 🇰🇪</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
