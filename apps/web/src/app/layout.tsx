import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { WhatsAppFab } from '@/components/layout/whatsapp-fab'
import { QuoteBasket } from '@/components/quote/quote-basket'
import { QuoteBootstrap } from '@/components/quote/quote-bootstrap'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Dewmix Hardware — B2B Hardware Procurement Platform, Kenya',
    template: '%s — Dewmix Hardware',
  },
  description:
    'Browse and quote hardware, tools, building materials, paint, electrical and plumbing supplies. Build a quote basket, send via WhatsApp. Kenol Road, Kenya.',
  keywords: ['hardware Kenya', 'construction materials', 'B2B procurement', 'hardware supplier', 'Dewmix', 'quote basket'],
  openGraph: { type: 'website', locale: 'en_KE', siteName: 'Dewmix Hardware' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1020' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-dvh font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QuoteBootstrap />
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
            Skip to main content
          </a>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
          <WhatsAppFab />
          <QuoteBasket />
        </ThemeProvider>
      </body>
    </html>
  )
}
