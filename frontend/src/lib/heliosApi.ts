import { api, apiAuth } from './api'

const BASE = '/helios'

export interface StationInfo {
  id: string
  nombre: string
  subtitulo: string
  problema: string | null
  archivo: string
  auto_completar: boolean
}

export interface EquipoProgress {
  equipo_id: string
  nombre: string
  ruta_id: string
  ruta_nombre: string
  codigo: string
  numero: number
  estaciones_completadas: string[]
  fragmentos: string[]
  total_estaciones: number
  estacion_actual: StationInfo | null
  estacion_actual_index: number
  iniciado_en: string | null
  completado_en: string | null
  completado: boolean
}

export interface ValidarResponse {
  correcto: boolean
  keyword: string | null
  mensaje: string
  fragmentos: string[]
  estaciones_completadas: string[]
  completado: boolean
}

export interface ValidarFinalResponse {
  correcto: boolean
  mensaje: string
}

export interface AdminEquipoSummary {
  equipo_id: string
  nombre: string
  ruta_nombre: string
  numero: number
  fragmentos_obtenidos: number
  total_fragmentos: number
  completado: boolean
  iniciado: boolean
  iniciado_en: string | null
  completado_en: string | null
  estacion_actual_nombre: string | null
  porcentaje: number
}

export interface AdminHeliosResponse {
  equipos: AdminEquipoSummary[]
  completados: number
  en_progreso: number
  sin_iniciar: number
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function loginEquipo(codigo: string) {
  return api<EquipoProgress>(`${BASE}/login`, {
    method: 'POST',
    body: JSON.stringify({ codigo }),
  })
}

export function getProgress(equipo_id: string) {
  return api<EquipoProgress>(`${BASE}/equipos/${equipo_id}`)
}

export function iniciarJuego(equipo_id: string) {
  return api<{ equipo_id: string; iniciado_en: string }>(`${BASE}/iniciar/${equipo_id}`, {
    method: 'POST',
  })
}

export function validarRespuesta(equipo_id: string, station_id: string, respuesta: string) {
  return api<ValidarResponse>(`${BASE}/validar`, {
    method: 'POST',
    body: JSON.stringify({ equipo_id, station_id, respuesta }),
  })
}

export function confirmarBloqueG(equipo_id: string) {
  return api<ValidarResponse>(`${BASE}/confirmar-bloque-g`, {
    method: 'POST',
    body: JSON.stringify({ equipo_id }),
  })
}

export function validarFinal(equipo_id: string, respuesta: string) {
  return api<ValidarFinalResponse>(`${BASE}/validar-final`, {
    method: 'POST',
    body: JSON.stringify({ equipo_id, respuesta }),
  })
}

// ── Admin API ──────────────────────────────────────────────────────────────────

export function getAdminHelios() {
  return apiAuth<AdminHeliosResponse>('/admin/helios')
}

export function resetEquipo(equipo_id: string) {
  return apiAuth<void>(`/admin/helios/reset/${equipo_id}`, { method: 'POST' })
}

export function resetAll() {
  return apiAuth<void>('/admin/helios/reset', { method: 'POST' })
}
