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

export type AgentStatus = 'offline' | 'available' | 'busy' | 'break' | 'suspended'
export type VehicleType = 'bike' | 'scooter' | 'car' | 'van'

export interface Agent {
  id: string
  userId: string
  status: AgentStatus
  isOnline: boolean
  vehicleType?: VehicleType | null
  vehiclePlate?: string | null
  maxConcurrentOrders?: number | null
  currentOrderId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  user?: SafeAuthUser
}

export interface ListAgentsQuery {
  status?: AgentStatus
  isOnline?: boolean
  vehicleType?: VehicleType
  isActive?: boolean
}

export interface CreateAgentInput {
  userId: string
  vehicleType: VehicleType
  vehiclePlate: string
  maxConcurrentOrders: number
}

export interface UpdateAgentInput {
  status?: AgentStatus
  isOnline?: boolean
  vehicleType?: VehicleType
  vehiclePlate?: string
  maxConcurrentOrders?: number
  currentOrderId?: string | null
  isActive?: boolean
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
