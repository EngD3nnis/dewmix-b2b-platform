'use client'

import { useState, useTransition } from 'react'
import { Phone, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestOtp } from '@/lib/auth/actions'

interface Props {
  onCodeSent: (phone: string, devCode?: string) => void
}

export function PhoneStep({ onCodeSent }: Props) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.set('phone', phone)

    startTransition(async () => {
      const result = await requestOtp(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      onCodeSent(phone, result.devCode)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
          Phone number
        </label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0712 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12 pl-10"
            required
            disabled={isPending}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">We'll send you a 6-digit code via SMS.</p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending || phone.length < 10}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {isPending ? 'Sending code...' : 'Send code'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to Dewmix's{' '}
        <a href="/terms" className="underline hover:text-foreground">Terms</a> &{' '}
        <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
      </p>
    </form>
  )
}
