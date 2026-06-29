import { getAccessToken } from './auth'

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(status: number, detail: unknown) {
    super('API error')
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

const API_URL = import.meta.env.VITE_API_URL as string

if (!API_URL) {
  console.warn('VITE_API_URL is not defined. API calls will fail.')
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(path, options, false)
}

export async function apiAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(path, options, true)
}

async function apiRequest<T>(
  path: string,
  options: RequestInit,
  authenticated: boolean,
): Promise<T> {
  const headers = new Headers(options.headers)

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (authenticated) {
    const token = getAccessToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    throw new ApiError(response.status, detail?.detail ?? detail)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function mapApiErrorToSpanish(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') {
    if (detail === 'Student registration is currently disabled') {
      return 'El registro no está abierto en este momento.'
    }
    if (detail === 'Email already registered') {
      return 'Este email ya está registrado.'
    }
    if (detail === 'Invalid email or password') {
      return 'Email o contraseña incorrectos.'
    }
    if (detail === 'Insufficient permissions') {
      return 'No tienes permisos para realizar esta acción.'
    }
    if (detail === 'No students to assign to teams') {
      return 'No hay estudiantes registrados para asignar a equipos.'
    }
    if (detail === 'Team not found') {
      return 'Equipo no encontrado.'
    }
    if (detail === 'Student not found') {
      return 'Estudiante no encontrado.'
    }
    if (detail === 'Leader must be a member of the team') {
      return 'El líder debe ser miembro del equipo.'
    }
    if (detail === 'Marketplace is currently closed.') {
      return 'El marketplace está cerrado en este momento.'
    }
    if (detail === 'Insufficient stock.') {
      return 'Stock insuficiente para esta compra.'
    }
    if (detail === 'Insufficient budget.') {
      return 'Presupuesto insuficiente para esta compra.'
    }
    if (detail === 'Producto no encontrado.') {
      return 'Producto no encontrado.'
    }
    if (detail === 'Solo el líder puede realizar esta acción.') {
      return 'Solo el líder del equipo puede realizar compras.'
    }
    return detail
  }

  if (Array.isArray(detail)) {
    const first = detail[0] as { msg?: string } | undefined
    if (first?.msg?.includes('Colombian mobile')) {
      return 'Debe ser un celular colombiano de 10 dígitos que inicie en 3.'
    }
    if (first?.msg?.includes('at least 8 characters')) {
      return 'La contraseña debe tener al menos 8 caracteres.'
    }
  }

  return fallback
}
