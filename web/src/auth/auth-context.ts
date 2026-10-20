import { createContext, useContext } from 'react'
import type { AxiosError } from 'axios'
import type { LoginInput, SafeAuthUser } from '../lib/types'

export type AuthStatus = 'pending' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  user: SafeAuthUser | null
  status: AuthStatus
  login: (input: LoginInput) => Promise<SafeAuthUser>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  isLoggingIn: boolean
  isLoggingOut: boolean
  error: AxiosError | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth() must be used inside <AuthProvider>')
  }
  return context
}
