export interface Student {
  id: string
  name: string
  colegio: string
  grado: number
  equipo: string | null
}

export interface Team {
  id: string
  name: string
  members: number
  colegio: string
}

export const mockStudents: Student[] = [
  { id: '1', name: 'Estudiante 01', colegio: 'Colegio A', grado: 10, equipo: 'Equipo 1' },
  { id: '2', name: 'Estudiante 02', colegio: 'Colegio B', grado: 11, equipo: 'Equipo 1' },
  { id: '3', name: 'Estudiante 03', colegio: 'Colegio A', grado: 9, equipo: 'Equipo 2' },
  { id: '4', name: 'Estudiante 04', colegio: 'Colegio C', grado: 10, equipo: 'Equipo 2' },
  { id: '5', name: 'Estudiante 05', colegio: 'Colegio B', grado: 11, equipo: null },
  { id: '6', name: 'Estudiante 06', colegio: 'Colegio D', grado: 10, equipo: null },
]

export const mockTeams: Team[] = [
  { id: '1', name: 'Equipo 1', members: 4, colegio: 'MIXTO' },
  { id: '2', name: 'Equipo 2', members: 4, colegio: 'MIXTO' },
  { id: '3', name: 'Equipo 3', members: 3, colegio: 'COLEGIO A' },
  { id: '4', name: 'Equipo 4', members: 4, colegio: 'COLEGIO B' },
]

export function formatGrado(grado: number): string {
  return `${grado}.°`
}
