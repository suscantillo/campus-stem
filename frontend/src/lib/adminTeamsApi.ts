import { apiAuth } from './api'

export type LeaderAssignment = 'none' | 'random' | 'first'

export interface TeamMember {
  id: string
  nombre_completo: string
  colegio: string | null
  is_lider: boolean
}

export interface TeamListItem {
  id: string
  nombre: string
  colegio_label: string
  member_count: number
  lider_id: string | null
  lider_nombre: string | null
  miembros: TeamMember[]
  created_at: string
}

export interface TeamListResponse {
  items: TeamListItem[]
  total: number
}

export interface GenerateTeamsPayload {
  team_size: number
  leader_assignment: LeaderAssignment
}

export interface GenerateTeamsResponse extends TeamListResponse {
  students_assigned: number
}

export interface CreateTeamPayload {
  nombre?: string
}

export interface UpdateTeamPayload {
  nombre?: string
  lider_id?: string | null
}

export function listTeams() {
  return apiAuth<TeamListResponse>('/admin/teams')
}

export function createTeam(payload: CreateTeamPayload = {}) {
  return apiAuth<TeamListItem>('/admin/teams', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function generateTeams(payload: GenerateTeamsPayload) {
  return apiAuth<GenerateTeamsResponse>('/admin/teams/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTeam(teamId: string, payload: UpdateTeamPayload) {
  return apiAuth<TeamListItem>(`/admin/teams/${teamId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteTeam(teamId: string) {
  return apiAuth<void>(`/admin/teams/${teamId}`, {
    method: 'DELETE',
  })
}

export function assignStudentEquipo(studentId: string, equipoId: string | null) {
  return apiAuth<void>(`/admin/students/${studentId}/equipo`, {
    method: 'PATCH',
    body: JSON.stringify({ equipo_id: equipoId }),
  })
}

export const LEADER_ASSIGNMENT_OPTIONS: { value: LeaderAssignment; label: string }[] = [
  { value: 'none', label: 'Sin asignar líder' },
  { value: 'random', label: 'Líder aleatorio por equipo' },
  { value: 'first', label: 'Primer miembro de cada equipo' },
]
