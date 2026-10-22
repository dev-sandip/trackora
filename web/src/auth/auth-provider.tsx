import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { useCallback, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { authApi, setAccessToken, setSessionExpiredHandler } from '../lib/api'
import type { AuthTokensResponse, LoginInput, RegisterInput, SafeAuthUser } from '../lib/types'
import { AuthContext } from './auth-context'
import type { AuthContextValue } from './auth-context'
import { sessionQueryOptions } from './session.queries'

/**
 * Owns the session lifecycle on top of TanStack Query:
 * - session restore via the `['auth', 'session']` query (httpOnly cookie),
 * - login / logout / logout-all mutations with cache updates,
 * - hard session-drop when the axios interceptor reports a dead session.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  // Boot-time session restore (browser only — see session.queries.ts).
  const sessionQuery = useQuery(sessionQueryOptions)

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setAccessToken(null)
      queryClient.setQueryData(sessionQueryOptions.queryKey, null)
    })
    return () => setSessionExpiredHandler(null)
  }, [queryClient])

  const loginMutation = useMutation<AuthTokensResponse, AxiosError, LoginInput>(
    {
      mutationKey: ['auth', 'login'],
      mutationFn: (input) => authApi.login(input),
    },
  )

  const logoutMutation = useMutation<void, AxiosError>({
    mutationFn: () => authApi.logout(),
  })

  const logoutAllMutation = useMutation<void, AxiosError>({
    mutationFn: () => authApi.logoutAll(),
  })

  const registerMutation = useMutation<SafeAuthUser, AxiosError, RegisterInput>({
    mutationKey: ['auth', 'register'],
    mutationFn: (input) => authApi.register(input),
  })

  const login = useCallback(
    async (input: LoginInput): Promise<SafeAuthUser> => {
      const data = await loginMutation.mutateAsync(input)
      setAccessToken(data.accessToken)
      queryClient.setQueryData(sessionQueryOptions.queryKey, data.user)
      return data.user
    },
    [loginMutation, queryClient],
  )

  const clearLocalSession = useCallback(() => {
    setAccessToken(null)
    queryClient.setQueryData(sessionQueryOptions.queryKey, null)
    // Drop every non-auth cache entry so user data never outlives the session.
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== 'auth',
    })
  }, [queryClient])

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync().catch(() => {})
    clearLocalSession()
  }, [logoutMutation, clearLocalSession])

  const logoutAll = useCallback(async () => {
    await logoutAllMutation.mutateAsync().catch(() => {})
    clearLocalSession()
  }, [logoutAllMutation, clearLocalSession])

  const register = useCallback(
    async (input: RegisterInput): Promise<SafeAuthUser> => {
      const data = await registerMutation.mutateAsync(input)
      return data
    },
    [registerMutation],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user: sessionQuery.data ?? null,
      status: sessionQuery.isPending
        ? 'pending'
        : sessionQuery.data
          ? 'authenticated'
          : 'unauthenticated',
      login,
      logout,
      logoutAll,
      register,
      isLoggingIn: loginMutation.isPending,
      isLoggingOut: logoutMutation.isPending || logoutAllMutation.isPending,
      error: loginMutation.error,
    }),
    [
      sessionQuery.data,
      sessionQuery.isPending,
      login,
      logout,
      logoutAll,
      register,
      loginMutation.isPending,
      loginMutation.error,
      logoutMutation.isPending,
      logoutAllMutation.isPending,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
