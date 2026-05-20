'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search, Menu, X, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from './logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { HeaderQuote } from './header-quote'
import { env } from '@/env'

const NAV = [
  { href: '/categories/power-tools',        label: 'Power Tools' },
  { href: '/categories/building-materials', label: 'Building Materials' },
  { href: '/categories/paint-coatings',     label: 'Paint' },
  { href: '/categories/electrical',         label: 'Electrical' },
  { href: '/categories/plumbing',           label: 'Plumbing' },
  { href: '/categories/roofing',            label: 'Roofing' },
  { href: '/categories',                    label: 'All Categories' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Utility strip — desktop */}
      <div className="hidden border-b bg-secondary/40 lg:block">
        <div className="container flex h-9 items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {env.NEXT_PUBLIC_BUSINESS_ADDRESS}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> {env.NEXT_PUBLIC_CONTACT_PHONE}
            </span>
          </div>
          <a
            href={`https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
            target="_blank" rel="noreferrer"
            className="font-medium text-[#25D366] hover:underline"
          >
            WhatsApp us
          </a>
        </div>
      </div>

      {/* Main bar */}
      <div className="container flex h-16 items-center gap-4 lg:h-20">
        <Logo />

        {/* Search — desktop */}
        <form action="/products" className="hidden flex-1 max-w-2xl lg:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" type="search" placeholder="Search products, brands, SKUs..." className="h-11 pl-10" />
            <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2">Search</Button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <HeaderQuote />
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="container pb-3 lg:hidden">
        <form action="/products">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" type="search" placeholder="Search products..." className="h-11 pl-10" />
          </div>
        </form>
      </div>

      {/* Category nav — desktop */}
      <nav className="hidden border-t bg-background lg:block">
        <div className="container flex h-11 items-center gap-1 overflow-x-auto scrollbar-hide">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t lg:hidden">
          <nav className="container flex flex-col py-2">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-foreground hover:bg-accent">
                {item.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            <a href={`https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="rounded-md px-3 py-3 text-sm font-medium text-[#25D366] hover:bg-accent">
              WhatsApp us
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
