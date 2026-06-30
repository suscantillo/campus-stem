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

export interface UpdatePrivilegedUserPayload {
  nombre_completo?: string
  email?: string
  password?: string
}

export function createPrivilegedUser(body: CreatePrivilegedUserPayload) {
  return apiAuth<PrivilegedUser>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function listJueces() {
  return apiAuth<PrivilegedUser[]>('/admin/users/jueces')
}

export function updateJuez(id: string, body: UpdatePrivilegedUserPayload) {
  return apiAuth<PrivilegedUser>(`/admin/users/jueces/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteJuez(id: string) {
  return apiAuth<void>(`/admin/users/jueces/${id}`, { method: 'DELETE' })
}
