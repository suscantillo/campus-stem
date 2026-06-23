export type UserRole = 'estudiante' | 'admin' | 'juez' | 'super_admin'

export interface User {
  id: string
  email: string
  rol: UserRole
  nombre_completo: string
  colegio: string | null
  grado: number | null
  telefono: string | null
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

export interface RegisterPayload {
  nombre_completo: string
  colegio: string
  grado: number
  email: string
  telefono: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegistrationStatus {
  enabled: boolean
}

const ACCESS_TOKEN_KEY = 'campus_access_token'
const REFRESH_TOKEN_KEY = 'campus_refresh_token'
const USER_KEY = 'campus_user'

export function saveAuthSession(data: AuthResponse): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.tokens.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, data.tokens.refresh_token)
  localStorage.setItem(USER_KEY, JSON.stringify(data.user))
}

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function loadStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    clearAuthSession()
    return null
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getPostLoginPath(rol: UserRole): string {
  if (rol === 'admin' || rol === 'super_admin') return '/admin'
  if (rol === 'juez') return '/'
  return '/'
}

const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin']

export function isAdminRole(rol: UserRole): boolean {
  return hasAnyRole(rol, ADMIN_ROLES)
}

export function hasAnyRole(rol: UserRole, allowed: UserRole[]): boolean {
  if (rol === 'super_admin') return true
  return allowed.includes(rol)
}

export function isSuperAdmin(rol: UserRole): boolean {
  return rol === 'super_admin'
}
