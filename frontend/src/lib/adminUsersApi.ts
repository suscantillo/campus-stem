import { apiAuth } from './api'

export type PrivilegedRole = 'admin' | 'juez'

export interface CreatePrivilegedUserPayload {
  nombre_completo: string
  email: string
  password: string
  rol: PrivilegedRole
}

export interface PrivilegedUser {
  id: string
  email: string
  rol: PrivilegedRole
  nombre_completo: string
}

export function createPrivilegedUser(body: CreatePrivilegedUserPayload) {
  return apiAuth<PrivilegedUser>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
