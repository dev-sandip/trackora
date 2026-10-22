import { useAuth } from '@/auth/auth-context'
import type { ReactNode } from 'react'

export function AdminLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse rounded-full h-8 w-8 bg-muted"></div>
      </div>
    )
  }
  return <div className="min-h-screen bg-background">{children}</div>
}
