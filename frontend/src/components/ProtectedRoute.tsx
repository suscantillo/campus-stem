import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../lib/auth'
import { hasAnyRole } from '../lib/auth'

interface ProtectedRouteProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || user === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!hasAnyRole(user.rol, allowedRoles)) {
    return <Navigate to="/" replace state={{ reason: 'forbidden' }} />
  }

  return children
}
