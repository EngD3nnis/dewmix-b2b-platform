import { MessageCircle } from 'lucide-react'
import { env } from '@/env'

export function WhatsAppFab() {
  const href = `https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hi Dewmix! I'd like some help with..."
  )}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/10 transition-transform duration-200 ease-out-expo hover:scale-105 active:scale-95"
    >
      <MessageCircle className="h-6 w-6" strokeWidth={2.25} />
      <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-25" />
    </a>
  )
}
