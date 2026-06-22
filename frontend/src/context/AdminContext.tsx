import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface EventGates {
  registroOpen: boolean
  marketplaceOpen: boolean
  calificacionOpen: boolean
}

interface AdminContextValue extends EventGates {
  toggleRegistro: () => void
  toggleMarketplace: () => void
  toggleCalificacion: () => void
  studentCount: number
  teamCount: number
  productCount: number
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [registroOpen, setRegistroOpen] = useState(true)
  const [marketplaceOpen, setMarketplaceOpen] = useState(false)
  const [calificacionOpen, setCalificacionOpen] = useState(false)

  const value = useMemo<AdminContextValue>(
    () => ({
      registroOpen,
      marketplaceOpen,
      calificacionOpen,
      toggleRegistro: () => setRegistroOpen((v) => !v),
      toggleMarketplace: () => setMarketplaceOpen((v) => !v),
      toggleCalificacion: () => setCalificacionOpen((v) => !v),
      studentCount: 128,
      teamCount: 32,
      productCount: 14,
    }),
    [registroOpen, marketplaceOpen, calificacionOpen],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}

/** Gates readable outside admin (e.g. registration page). */
export function useRegistrationOpen() {
  const ctx = useContext(AdminContext)
  return ctx?.registroOpen ?? true
}
