import { api, apiAuth } from './api'
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  RegistrationStatus,
} from './auth'

export function getRegistrationStatus() {
  return api<RegistrationStatus>('/registration/status')
}

export function registerStudent(body: RegisterPayload) {
  return api<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function login(body: LoginPayload) {
  return api<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function logout(refreshToken: string) {
  return api<void>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export interface RegistrationAdminResponse {
  enabled: boolean
  updated_at: string
}

export function setRegistrationEnabled(enabled: boolean) {
  return apiAuth<RegistrationAdminResponse>('/admin/registration', {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  })
}
