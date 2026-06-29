import { apiAuth } from './api'

export interface CriterioResponse {
  id: string
  nombre: string
  descripcion: string | null
  puntaje_maximo: number
  orden: number
}

export interface JuezInfo {
  id: string
  nombre_completo: string
}

export interface EquipoInfo {
  id: string
  nombre: string
}

export interface MatrizAsignacionesResponse {
  jueces: JuezInfo[]
  equipos: EquipoInfo[]
  asignados: string[] // "juez_id:equipo_id"
}

export interface CalificacionStatusResponse {
  calificacion_abierta: boolean
  total_jueces: number
  total_equipos: number
  calificaciones_enviadas: number
  calificaciones_esperadas: number
}

export interface NotaJuezResponse {
  juez_id: string
  juez_nombre: string
  total: number | null
}

export interface ResultadoEquipoResponse {
  posicion: number
  equipo_id: string
  equipo_nombre: string
  notas: NotaJuezResponse[]
  promedio: number | null
  calificaciones_recibidas: number
  calificaciones_esperadas: number
  estado: 'Completo' | 'Parcial' | 'Sin calificar'
}

export interface ResultadosResponse {
  criterios: CriterioResponse[]
  resultados: ResultadoEquipoResponse[]
  jueces: JuezInfo[]
}

// ── Criterios ──────────────────────────────────────────────────────────────────

export function listCriterios() {
  return apiAuth<CriterioResponse[]>('/admin/calificacion/criterios')
}

export function createCriterio(data: { nombre: string; descripcion?: string | null; puntaje_maximo: number; orden?: number }) {
  return apiAuth<CriterioResponse>('/admin/calificacion/criterios', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateCriterio(id: string, data: { nombre?: string; descripcion?: string | null; puntaje_maximo?: number; orden?: number }) {
  return apiAuth<CriterioResponse>(`/admin/calificacion/criterios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteCriterio(id: string) {
  return apiAuth<void>(`/admin/calificacion/criterios/${id}`, { method: 'DELETE' })
}

export function reorderCriterios(ids: string[]) {
  return apiAuth<CriterioResponse[]>('/admin/calificacion/criterios/orden', {
    method: 'PATCH',
    body: JSON.stringify({ ids }),
  })
}

// ── Asignaciones ───────────────────────────────────────────────────────────────

export function getMatriz() {
  return apiAuth<MatrizAsignacionesResponse>('/admin/calificacion/asignaciones')
}

export function resetAsignaciones() {
  return apiAuth<MatrizAsignacionesResponse>('/admin/calificacion/asignaciones/reset', { method: 'POST' })
}

export function toggleAsignacion(juez_id: string, equipo_id: string) {
  return apiAuth<MatrizAsignacionesResponse>('/admin/calificacion/asignaciones/toggle', {
    method: 'POST',
    body: JSON.stringify({ juez_id, equipo_id }),
  })
}

// ── Toggle + status ────────────────────────────────────────────────────────────

export function getCalificacionStatus() {
  return apiAuth<CalificacionStatusResponse>('/admin/calificacion/status')
}

export function toggleCalificacion(calificacion_abierta: boolean) {
  return apiAuth<CalificacionStatusResponse>('/admin/calificacion/toggle', {
    method: 'PATCH',
    body: JSON.stringify({ calificacion_abierta }),
  })
}

// ── Resultados ─────────────────────────────────────────────────────────────────

export function getResultados() {
  return apiAuth<ResultadosResponse>('/admin/calificacion/resultados')
}

export function getExportUrl() {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'
  return `${base}/admin/calificacion/resultados/export`
}
