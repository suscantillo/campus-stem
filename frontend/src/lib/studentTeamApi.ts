import { apiAuth } from './api'

export interface MiembroEquipo {
  id: string
  nombre_completo: string
  colegio: string | null
  grado: number | null
  es_lider: boolean
}

export interface MiEquipoResponse {
  equipo_id: string
  equipo_nombre: string
  nombre_confirmado: boolean
  presupuesto: number
  es_lider: boolean
  miembros: MiembroEquipo[]
}

export function getMiEquipoStudent() {
  return apiAuth<MiEquipoResponse>('/me/equipo')
}

export function renombrarEquipo(nombre: string) {
  return apiAuth<MiEquipoResponse>('/me/equipo/nombre', {
    method: 'PATCH',
    body: JSON.stringify({ nombre }),
  })
}
