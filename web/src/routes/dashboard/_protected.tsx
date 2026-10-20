import {
  Navigate,
  Outlet,
  createFileRoute,
  redirect,
} from '@tanstack/react-router'
import { useAuth } from '../../auth/auth-context'
import { sessionQueryOptions } from '../../auth/session.queries'

/**
 * Pathless layout route — everything inside `src/routes/_protected/` requires
 * an authenticated session.
 *
 * Two layers of protection:
 * 1. `beforeLoad` (browser only): resolves the session query and redirects to
 *    /login with the original URL in `?redirect=` when signed out.
 * 2. The component gate: renders a spinner while the session is being
 *    restored and redirects if it resolves to "signed out" (covers the
 *    initial SSR/hydration pass, where beforeLoad intentionally skips).
 */
export const Route = createFileRoute('/dashboard/_protected')({
  beforeLoad: async ({ context, location }) => {
    if (typeof window === 'undefined') return
    const session = await context.queryClient.query(sessionQueryOptions)
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const { status } = useAuth()

  if (status === 'pending') {
    return <p style={{ padding: 24, color: '#64748b' }}>Checking session…</p>
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
