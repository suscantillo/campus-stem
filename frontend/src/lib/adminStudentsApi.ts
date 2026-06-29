import { apiAuth } from './api'

export interface StudentListItem {
  id: string
  nombre_completo: string
  colegio: string | null
  grado: number | null
  email: string
  telefono: string | null
  equipo_id: string | null
  equipo_nombre: string | null
  es_lider: boolean
  created_at: string
}

export interface StudentListResponse {
  items: StudentListItem[]
  total: number
}

export function listStudents() {
  return apiAuth<StudentListResponse>('/admin/students')
}

export function deleteStudent(studentId: string) {
  return apiAuth<void>(`/admin/students/${studentId}`, { method: 'DELETE' })
}

export function formatGrado(grado: number | null): string {
  if (grado === null) return '—'
  return `${grado}.°`
}
