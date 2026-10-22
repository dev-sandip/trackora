import axios, { AxiosError } from 'axios'
import type {
  Agent,
  AuthTokensResponse,
  CreateAgentInput,
  ListAgentsQuery,
  LoginInput,
  RegisterInput,
  SafeAuthUser,
  UpdateAgentInput,
} from './types'

const baseURL = import.meta.env.VITE_SERVER_URL
const prefix = import.meta.env.VITE_API_PREFIX ?? '/api/v1'

/**
 * Axios instance for the NestJS auth API.
 * - `withCredentials` sends the httpOnly `refresh_token` cookie on /auth/* calls.
 * - The access token lives only in this module's memory — never localStorage.
 */
export const api = axios.create({
  baseURL: baseURL + prefix,
  withCredentials: true,
})

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

let sessionExpiredHandler: (() => void) | null = null

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler
}
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config
    const status = error.response?.status
    const url = original?.url ?? ''

    // A 401 from the refresh endpoint itself: the session is definitively dead.
    if (url.includes('/auth/refresh') && status === 401) {
      setAccessToken(null)
      sessionExpiredHandler?.()
      throw error
    }

    // Never refresh-and-retry for auth endpoints, and never twice.
    if (
      !original ||
      status !== 401 ||
      original._retry ||
      url.includes('/auth/')
    ) {
      throw error
    }

    original._retry = true
    try {
      refreshPromise ??= axios
        .post<AuthTokensResponse>(
          `${api.defaults.baseURL}/auth/refresh`,
          undefined,
          { withCredentials: true },
        )
        .then(({ data }) => {
          setAccessToken(data.accessToken)
          return data.accessToken
        })
        .finally(() => {
          refreshPromise = null
        })

      const token = await refreshPromise
      original.headers.Authorization = `Bearer ${token}`
      return api(original)
    } catch (refreshError) {
      setAccessToken(null)
      sessionExpiredHandler?.()
      throw refreshError
    }
  },
)

export const authApi = {
  login: async (input: LoginInput): Promise<AuthTokensResponse> => {
    const { data } = await api.post<AuthTokensResponse>('/auth/login', input)
    setAccessToken(data.accessToken)
    return data
  },

  register: async (input: RegisterInput): Promise<SafeAuthUser> =>
    (await api.post<SafeAuthUser>('/auth/register', input)).data,

  refresh: async (): Promise<AuthTokensResponse> => {
    const { data } = await api.post<AuthTokensResponse>('/auth/refresh')
    setAccessToken(data.accessToken)
    return data
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
    }
  },

  logoutAll: async (): Promise<void> => {
    try {
      await api.post('/auth/logout-all')
    } finally {
      setAccessToken(null)
    }
  },
  me: async (): Promise<SafeAuthUser> =>
    (await api.get<SafeAuthUser>('/auth/me')).data,
}

export const adminApi = {
  getAllUsers: async (): Promise<SafeAuthUser[]> =>
    (await api.get<SafeAuthUser[]>('/auth/all-users')).data,

  listAgents: async (query: ListAgentsQuery = {}): Promise<Agent[]> => {
    const params = new URLSearchParams()
    if (query.status) params.set('status', query.status)
    if (query.isOnline !== undefined) params.set('isOnline', String(query.isOnline))
    if (query.vehicleType) params.set('vehicleType', query.vehicleType)
    if (query.isActive !== undefined) params.set('isActive', String(query.isActive))
    const { data } = await api.get<Agent[]>(`/agent?${params.toString()}`)
    return data
  },

  getAgent: async (id: string): Promise<Agent> =>
    (await api.get<Agent>(`/agent/${id}`)).data,

  createAgent: async (input: CreateAgentInput): Promise<void> => {
    await api.post('/agent', input)
  },

  updateAgent: async (id: string, input: UpdateAgentInput): Promise<void> => {
    await api.patch(`/agent/${id}`, input)
  },

  deleteAgent: async (id: string): Promise<void> => {
    await api.delete(`/agent/${id}`)
  },
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong',
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      { message?: string | string[] } | undefined
    if (typeof data?.message === 'string') return data.message
    if (Array.isArray(data?.message)) return data.message.join(', ')
  }
  return fallback
}
