export type UserRole = 'agent' | 'admin'
export interface SafeAuthUser {
  id: string
  name: string
  email: string
  avatar: string | null
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

/** Mirrors the NestJS `AuthTokensResponse`. */
export interface AuthTokensResponse {
  user: SafeAuthUser
  accessToken: string
  /** null when the API is configured with AUTH_REFRESH_TOKEN_TRANSPORT=cookie. */
  refreshToken: string | null
  tokenType: 'Bearer'
  /** Access token lifetime in seconds. */
  expiresIn: number
}
