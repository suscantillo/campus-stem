import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, mapApiErrorToSpanish } from '../lib/api'
import { listStudents } from '../lib/adminStudentsApi'
import { listTeams } from '../lib/adminTeamsApi'
import { getRegistrationStatus, setRegistrationEnabled } from '../lib/authApi'
import { useNotification } from './NotificationContext'

interface EventGates {
  registroOpen: boolean
  registroLoading: boolean
  registroToggling: boolean
  registroError: string | null
  marketplaceOpen: boolean
  calificacionOpen: boolean
}

interface AdminContextValue extends EventGates {
  toggleRegistro: () => Promise<void>
  toggleMarketplace: () => void
  toggleCalificacion: () => void
  studentCount: number
  teamCount: number
  productCount: number
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { notify } = useNotification()
  const [registroOpen, setRegistroOpen] = useState(false)
  const [registroLoading, setRegistroLoading] = useState(true)
  const [registroToggling, setRegistroToggling] = useState(false)
  const [registroError, setRegistroError] = useState<string | null>(null)
  const [marketplaceOpen, setMarketplaceOpen] = useState(false)
  const [calificacionOpen, setCalificacionOpen] = useState(false)
  const [studentCount, setStudentCount] = useState(0)
  const [teamCount, setTeamCount] = useState(0)

  const loadDashboardCounts = useCallback(async () => {
    try {
      const [students, teams] = await Promise.all([listStudents(), listTeams()])
      setStudentCount(students.total)
      setTeamCount(teams.total)
    } catch {
      // KPIs are non-blocking; pages load their own data.
    }
  }, [])

  const loadRegistrationStatus = useCallback(async () => {
    setRegistroLoading(true)
    setRegistroError(null)
    try {
      const data = await getRegistrationStatus()
      setRegistroOpen(data.enabled)
    } catch (error) {
      if (error instanceof ApiError) {
        setRegistroError(mapApiErrorToSpanish(error.detail, 'No se pudo cargar el estado del registro.'))
      } else {
        setRegistroError('No se pudo conectar con el servidor.')
      }
    } finally {
      setRegistroLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRegistrationStatus()
    void loadDashboardCounts()
  }, [loadRegistrationStatus, loadDashboardCounts])

  const toggleRegistro = useCallback(async () => {
    if (registroToggling || registroLoading) return

    const next = !registroOpen
    setRegistroToggling(true)
    setRegistroError(null)

    try {
      const data = await setRegistrationEnabled(next)
      setRegistroOpen(data.enabled)
      notify({
        type: 'success',
        title: data.enabled ? 'Registro habilitado' : 'Registro deshabilitado',
        message: data.enabled
          ? 'Los estudiantes ya pueden crear su cuenta.'
          : 'La página pública de registro queda cerrada.',
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? mapApiErrorToSpanish(error.detail, 'No se pudo actualizar el registro.')
          : 'No se pudo conectar con el servidor.'
      setRegistroError(message)
      notify({ type: 'error', title: 'No se pudo actualizar', message })
    } finally {
      setRegistroToggling(false)
    }
  }, [registroOpen, registroLoading, registroToggling, notify])

  const value = useMemo<AdminContextValue>(
    () => ({
      registroOpen,
      registroLoading,
      registroToggling,
      registroError,
      marketplaceOpen,
      calificacionOpen,
      toggleRegistro,
      toggleMarketplace: () => setMarketplaceOpen((v) => !v),
      toggleCalificacion: () => setCalificacionOpen((v) => !v),
      studentCount,
      teamCount,
      productCount: 14,
    }),
    [
      registroOpen,
      registroLoading,
      registroToggling,
      registroError,
      marketplaceOpen,
      calificacionOpen,
      toggleRegistro,
      studentCount,
      teamCount,
    ],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
