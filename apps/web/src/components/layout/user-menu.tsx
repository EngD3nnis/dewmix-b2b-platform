'use client'

import Link from 'next/link'
import { User, FileText, LogOut, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logout } from '@/lib/auth/actions'

interface Props {
  user: { firstName: string | null; phone: string | null; role: string } | null
}

export function UserMenu({ user }: Props) {
  if (!user) {
    return (
      <Button variant="ghost" size="icon" aria-label="Log in" asChild>
        <Link href="/login">
          <User className="h-5 w-5" />
        </Link>
      </Button>
    )
  }

  const initial = (user.firstName?.[0] ?? user.phone?.slice(-2)[0] ?? 'U').toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu" className="relative">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initial}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <Link href="/account" className="block px-2 py-2 text-sm">
          <p className="font-medium">{user.firstName ?? 'My account'}</p>
          {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account/quotes">
            <FileText className="mr-2 h-4 w-4" /> My Quotes
          </Link>
        </DropdownMenuItem>
        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <ChevronRight className="mr-2 h-4 w-4" /> Admin
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={logout} className="w-full">
            <button type="submit" className="flex w-full items-center text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
