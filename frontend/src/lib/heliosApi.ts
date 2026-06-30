import { api, apiAuth } from './api'

export interface StationInfo {
  id: string
  nombre: string
  subtitulo: string
  problema: string | null
  archivo: string
  auto_completar: boolean
}

export interface HeliosMiembroInfo {
  usuario_id: string
  nombre_completo: string
  es_lider: boolean
}

export interface EquipoProgress {
  equipo_id: string
  nombre: string
  ruta_id: string
  ruta_nombre: string
  numero: number
  es_lider: boolean
  miembros: HeliosMiembroInfo[]
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

export interface HeliosEquipoMiembro {
  usuario_id: string
  nombre_completo: string
  email: string
}

export interface HeliosEquipoAdmin {
  id: string
  nombre: string
  nombre_id: string
  ruta_id: string
  ruta_nombre: string
  numero: number
  lider_id: string | null
  miembros: HeliosEquipoMiembro[]
  iniciado: boolean
  completado: boolean
  porcentaje: number
}

export interface EstudianteDisponible {
  id: string
  nombre_completo: string
  email: string
}

// ── Public status ──────────────────────────────────────────────────────────────

export function getHeliosStatus() {
  return api<{ helios_abierto: boolean }>('/helios/status')
}

// ── Admin toggle ───────────────────────────────────────────────────────────────

export function toggleHelios(helios_abierto: boolean) {
  return apiAuth<{ helios_abierto: boolean }>('/admin/helios/toggle', {
    method: 'PATCH',
    body: JSON.stringify({ helios_abierto }),
  })
}

// ── Game API (all authenticated) ───────────────────────────────────────────────

export function getMyHeliosEquipo() {
  return apiAuth<EquipoProgress>('/helios/mi-equipo')
}

export function getProgress(equipo_id: string) {
  return apiAuth<EquipoProgress>('/helios/equipos/' + equipo_id)
}

export function iniciarJuego(equipo_id: string) {
  return apiAuth<{ equipo_id: string; iniciado_en: string }>(`/helios/iniciar/${equipo_id}`, {
    method: 'POST',
  })
}

export function validarRespuesta(equipo_id: string, station_id: string, respuesta: string) {
  return apiAuth<ValidarResponse>('/helios/validar', {
    method: 'POST',
    body: JSON.stringify({ equipo_id, station_id, respuesta }),
  })
}

export function confirmarBloqueG(equipo_id: string) {
  return apiAuth<ValidarResponse>('/helios/confirmar-bloque-g', {
    method: 'POST',
    body: JSON.stringify({ equipo_id }),
  })
}

export function validarFinal(equipo_id: string, respuesta: string) {
  return apiAuth<ValidarFinalResponse>('/helios/validar-final', {
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

// ── Admin team management ──────────────────────────────────────────────────────

export function listHeliosEquipos() {
  return apiAuth<HeliosEquipoAdmin[]>('/admin/helios/equipos')
}

export function createHeliosEquipo(nombre: string) {
  return apiAuth<HeliosEquipoAdmin>('/admin/helios/equipos', {
    method: 'POST',
    body: JSON.stringify({ nombre }),
  })
}

export function deleteHeliosEquipo(id: string) {
  return apiAuth<void>(`/admin/helios/equipos/${id}`, { method: 'DELETE' })
}

export function addHeliosMiembro(equipoId: string, usuarioId: string) {
  return apiAuth<void>(`/admin/helios/equipos/${equipoId}/miembros`, {
    method: 'POST',
    body: JSON.stringify({ usuario_id: usuarioId }),
  })
}

export function removeHeliosMiembro(equipoId: string, usuarioId: string) {
  return apiAuth<void>(`/admin/helios/equipos/${equipoId}/miembros/${usuarioId}`, {
    method: 'DELETE',
  })
}

export function setHeliosLider(equipoId: string, usuarioId: string) {
  return apiAuth<void>(`/admin/helios/equipos/${equipoId}/lider`, {
    method: 'PUT',
    body: JSON.stringify({ usuario_id: usuarioId }),
  })
}

export function getEstudiantesDisponibles() {
  return apiAuth<EstudianteDisponible[]>('/admin/helios/estudiantes-disponibles')
}
