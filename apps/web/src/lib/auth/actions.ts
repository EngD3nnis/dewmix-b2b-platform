'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { RequestOtpSchema, VerifyOtpSchema } from '@dewmix/types'
import { env } from '@/env'

type ActionResult = { ok: true; message?: string; devCode?: string } | { ok: false; error: string }

/**
 * Request an OTP. Returns a result indicating success/failure.
 * In dev, includes the OTP code itself for testing.
 */
export async function requestOtp(formData: FormData): Promise<ActionResult> {
  const phone = String(formData.get('phone') ?? '')
  const parsed = RequestOtpSchema.safeParse({ phone, purpose: 'login' })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid phone number' }
  }

  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })

    const body = await res.json()
    if (!res.ok) {
      return { ok: false, error: body.message ?? 'Could not send code' }
    }

    return { ok: true, message: body.message, devCode: body.devCode }
  } catch (err) {
    return { ok: false, error: 'Network error. Try again.' }
  }
}

/**
 * Verify an OTP and complete login. Sets auth cookies and redirects to /account.
 */
export async function verifyOtp(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const phone = String(formData.get('phone') ?? '')
  const code = String(formData.get('code') ?? '')
  const parsed = VerifyOtpSchema.safeParse({ phone, code })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid code' }
  }

  let success = false
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { ok: false, error: body.message ?? 'Invalid code' }
    }

    // Forward cookies set by the API onto the Next.js response
    const setCookieHeader = res.headers.get('set-cookie')
    if (setCookieHeader) {
      const cookieStore = await cookies()
      // Parse and forward each cookie. set-cookie can have multiple values.
      const parts = setCookieHeader.split(/,(?=\s*[^;]+=)/)
      for (const part of parts) {
        const [nameValue, ...attrs] = part.trim().split(';')
        const [name, ...valueParts] = nameValue.split('=')
        if (!name || valueParts.length === 0) continue
        const attrMap = Object.fromEntries(
          attrs.map((a) => {
            const [k, v] = a.trim().split('=')
            return [k.toLowerCase(), v ?? true]
          })
        )
        cookieStore.set({
          name: name.trim(),
          value: valueParts.join('='),
          httpOnly: 'httponly' in attrMap,
          secure: 'secure' in attrMap,
          sameSite: 'lax',
          path: '/',
          maxAge: attrMap['max-age'] ? Number(attrMap['max-age']) : undefined,
        })
      }
    }

    success = true
  } catch {
    return { ok: false, error: 'Network error. Try again.' }
  }

  if (success) {
    revalidatePath('/', 'layout')
    redirect('/account')
  }
  return { ok: false, error: 'Unknown error' }
}

/** Log out — clears cookies via the API. */
export async function logout() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  try {
    await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    })
  } catch {
    // Even if API fails, clear local cookies
  }

  cookieStore.delete('dewmix_access')
  cookieStore.delete('dewmix_refresh')

  revalidatePath('/', 'layout')
  redirect('/')
}
