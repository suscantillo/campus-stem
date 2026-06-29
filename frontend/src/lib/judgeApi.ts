import { apiAuth } from './api'
import type { CriterioResponse } from './adminCalificacionApi'

export interface PuntajeResponse {
  criterio_id: string | null
  criterio_nombre: string | null
  puntaje: number
  puntaje_maximo: number | null
}

export interface CalificacionResponse {
  id: string
  juez_id: string | null
  equipo_id: string | null
  comentario: string | null
  total: number
  created_at: string
  puntajes: PuntajeResponse[]
}

export interface EquipoAsignadoResponse {
  equipo_id: string
  equipo_nombre: string
  calificacion: CalificacionResponse | null
}

export function getMisEquipos() {
  return apiAuth<EquipoAsignadoResponse[]>('/calificacion/mis-equipos')
}

export function getCriterios() {
  return apiAuth<CriterioResponse[]>('/calificacion/criterios')
}

export function enviarCalificacion(
  equipo_id: string,
  puntajes: { criterio_id: string; puntaje: number }[],
  comentario?: string,
) {
  return apiAuth<CalificacionResponse>(`/calificacion/equipos/${equipo_id}`, {
    method: 'POST',
    body: JSON.stringify({ puntajes, comentario: comentario ?? null }),
  })
}
