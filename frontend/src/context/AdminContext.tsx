import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, mapApiErrorToSpanish } from '../lib/api'
import { listStudents } from '../lib/adminStudentsApi'
import { listTeams } from '../lib/adminTeamsApi'
import { toggleMarketplace, listProductosAdmin } from '../lib/adminMarketplaceApi'
import { getCalificacionStatus, toggleCalificacion as apiToggleCalificacion } from '../lib/adminCalificacionApi'
import { getMarketplaceStatus } from '../lib/marketplaceApi'
import { getRegistrationStatus, setRegistrationEnabled } from '../lib/authApi'
import { useNotification } from './NotificationContext'

interface EventGates {
  registroOpen: boolean
  registroLoading: boolean
  registroToggling: boolean
  registroError: string | null
  marketplaceOpen: boolean
  marketplaceLoading: boolean
  marketplaceToggling: boolean
  calificacionOpen: boolean
  calificacionToggling: boolean
}

interface AdminContextValue extends EventGates {
  toggleRegistro: () => Promise<void>
  toggleMarketplace: () => Promise<void>
  calificacionToggling: boolean
  toggleCalificacion: () => Promise<void>
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
  const [marketplaceLoading, setMarketplaceLoading] = useState(true)
  const [marketplaceToggling, setMarketplaceToggling] = useState(false)
  const [calificacionOpen, setCalificacionOpen] = useState(false)
  const [calificacionToggling, setCalificacionToggling] = useState(false)
  const [studentCount, setStudentCount] = useState(0)
  const [teamCount, setTeamCount] = useState(0)
  const [productCount, setProductCount] = useState(0)

  const loadDashboardCounts = useCallback(async () => {
    try {
      const [students, teams, productos] = await Promise.all([listStudents(), listTeams(), listProductosAdmin()])
      setStudentCount(students.total)
      setTeamCount(teams.total)
      setProductCount(productos.total)
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

  const loadMarketplaceStatus = useCallback(async () => {
    setMarketplaceLoading(true)
    try {
      const data = await getMarketplaceStatus()
      setMarketplaceOpen(data.marketplace_abierto)
    } catch {
      // non-blocking
    } finally {
      setMarketplaceLoading(false)
    }
  }, [])

  const loadCalificacionStatus = useCallback(async () => {
    try {
      const data = await getCalificacionStatus()
      setCalificacionOpen(data.calificacion_abierta)
    } catch {
      // non-blocking
    }
  }, [])

  useEffect(() => {
    void loadRegistrationStatus()
    void loadMarketplaceStatus()
    void loadCalificacionStatus()
    void loadDashboardCounts()
  }, [loadRegistrationStatus, loadMarketplaceStatus, loadCalificacionStatus, loadDashboardCounts])

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

  const handleToggleMarketplace = useCallback(async () => {
    if (marketplaceToggling || marketplaceLoading) return
    const next = !marketplaceOpen
    setMarketplaceToggling(true)
    try {
      const data = await toggleMarketplace(next)
      setMarketplaceOpen(data.marketplace_abierto)
      notify({
        type: 'success',
        title: data.marketplace_abierto ? 'Marketplace abierto' : 'Marketplace cerrado',
        message: data.marketplace_abierto
          ? 'Los líderes ya pueden comprar.'
          : 'Las compras han sido deshabilitadas.',
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? mapApiErrorToSpanish(error.detail, 'No se pudo actualizar el marketplace.')
          : 'No se pudo conectar con el servidor.'
      notify({ type: 'error', title: 'Error', message })
    } finally {
      setMarketplaceToggling(false)
    }
  }, [marketplaceOpen, marketplaceLoading, marketplaceToggling, notify])

  const handleToggleCalificacion = useCallback(async () => {
    if (calificacionToggling) return
    setCalificacionToggling(true)
    try {
      const data = await apiToggleCalificacion(!calificacionOpen)
      setCalificacionOpen(data.calificacion_abierta)
    } catch {
      // silently ignore; GateTab shows the real error
    } finally {
      setCalificacionToggling(false)
    }
  }, [calificacionOpen, calificacionToggling])

  const value = useMemo<AdminContextValue>(
    () => ({
      registroOpen,
      registroLoading,
      registroToggling,
      registroError,
      marketplaceOpen,
      marketplaceLoading,
      marketplaceToggling,
      calificacionOpen,
      calificacionToggling,
      toggleRegistro,
      toggleMarketplace: handleToggleMarketplace,
      toggleCalificacion: handleToggleCalificacion,
      studentCount,
      teamCount,
      productCount,
    }),
    [
      registroOpen,
      registroLoading,
      registroToggling,
      registroError,
      marketplaceOpen,
      marketplaceLoading,
      marketplaceToggling,
      calificacionOpen,
      calificacionToggling,
      toggleRegistro,
      handleToggleMarketplace,
      handleToggleCalificacion,
      studentCount,
      teamCount,
      productCount,
    ],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
