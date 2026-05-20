'use client'

import { useState } from 'react'
import { PhoneStep } from './phone-step'
import { OtpStep } from './otp-step'

export function LoginFlow() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [devCode, setDevCode] = useState<string | undefined>(undefined)

  if (step === 'phone') {
    return (
      <PhoneStep
        onCodeSent={(p, code) => {
          setPhone(p)
          setDevCode(code)
          setStep('otp')
        }}
      />
    )
  }

  return <OtpStep phone={phone} devCode={devCode} onBack={() => setStep('phone')} />
}
