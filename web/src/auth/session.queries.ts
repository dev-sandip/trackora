import { queryOptions } from '@tanstack/react-query'
import { authApi, setAccessToken } from '../lib/api'
import type { SafeAuthUser } from '../lib/types'

/**
 * Single source of truth for the session. `null` = definitively signed out.
 *
 * Browser-only (`enabled`): the refresh cookie lives at the API origin inside
 * the user's browser, so the TanStack Start server cannot restore the session
 * during SSR. On the server the query stays pending and the client resolves it
 * right after hydration.
 */
export const sessionQueryOptions = queryOptions({
  queryKey: ['auth', 'session'] as const,
  enabled: typeof window !== 'undefined',
  staleTime: Infinity,
  gcTime: Infinity,
  retry: false,
  refetchOnWindowFocus: false,
  queryFn: async (): Promise<SafeAuthUser | null> => {
    try {
      const tokens = await authApi.refresh()
      setAccessToken(tokens.accessToken)
      return tokens.user
    } catch {
      setAccessToken(null)
      return null
    }
  },
})
