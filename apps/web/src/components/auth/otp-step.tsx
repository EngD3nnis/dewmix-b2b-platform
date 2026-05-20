'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { ArrowLeft, Loader2, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestOtp, verifyOtp } from '@/lib/auth/actions'
import { formatPhoneDisplay } from '@dewmix/utils'

interface Props {
  phone: string
  devCode?: string
  onBack: () => void
}

export function OtpStep({ phone, devCode, onBack }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [resendCooldown, setResendCooldown] = useState(60)
  const [resendDev, setResendDev] = useState<string | undefined>(devCode)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !isPending) {
      submit(code)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const submit = (codeValue: string) => {
    setError(null)
    const formData = new FormData()
    formData.set('phone', phone)
    formData.set('code', codeValue)

    startTransition(async () => {
      const result = await verifyOtp(null, formData)
      if (!result.ok) {
        setError(result.error)
        setCode('')
        inputRef.current?.focus()
      }
      // on success, server action redirects
    })
  }

  const resend = () => {
    if (resendCooldown > 0) return
    const formData = new FormData()
    formData.set('phone', phone)
    startTransition(async () => {
      const result = await requestOtp(formData)
      if (result.ok) {
        setResendCooldown(60)
        setResendDev(result.devCode)
        setError(null)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Change number
      </button>

      <div>
        <h2 className="text-lg font-semibold">Enter the code</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium text-foreground">{formatPhoneDisplay(phone)}</span>
        </p>
      </div>

      {resendDev && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
          <p className="font-medium text-warning">Dev mode</p>
          <p className="mt-1">Code: <span className="font-mono text-base font-bold">{resendDev}</span></p>
        </div>
      )}

      <div>
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="• • • • • •"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="h-14 text-center text-2xl font-mono tracking-[0.5em] tabular"
          disabled={isPending}
          aria-label="6-digit code"
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="button" size="lg" className="w-full" onClick={() => submit(code)} disabled={isPending || code.length < 6}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isPending ? 'Verifying...' : 'Verify & log in'}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={resend}
          disabled={resendCooldown > 0 || isPending}
          className="inline-flex items-center gap-1.5 text-sm text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          <RotateCw className="h-3.5 w-3.5" />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  )
}
