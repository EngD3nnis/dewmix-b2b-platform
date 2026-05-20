import { redirect } from 'next/navigation'
import { LoginFlow } from '@/components/auth/login-flow'
import { Logo } from '@/components/layout/logo'
import { getCurrentUser } from '@/lib/auth/session'

export const metadata = {
  title: 'Log in',
  description: 'Log in to your Dewmix Hardware account.',
}

export default async function LoginPage() {
  // If already logged in, send to account
  const user = await getCurrentUser()
  if (user) redirect('/account')

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="inline-block">
            <Logo />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Log in with your phone — no password needed.</p>
        </div>

        <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          <LoginFlow />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Trouble logging in? <a href="https://wa.me/254787151516" target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">WhatsApp us</a>.
        </p>
      </div>
    </div>
  )
}
