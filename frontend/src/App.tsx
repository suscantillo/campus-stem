import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminProvider } from './context/AdminContext'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { MarketplacePage } from './pages/MarketplacePage'
import { RegisterPage } from './pages/RegisterPage'
import { StudentTeamPage } from './pages/StudentTeamPage'
import { HeliosPage } from './pages/HeliosPage'
import { JudgePage } from './pages/JudgePage'
import { AdminCalificacionPage } from './pages/admin/AdminCalificacionPage'
import { AdminHeliosPage } from './pages/admin/AdminHeliosPage'
import { AdminHomePage, AdminLayout } from './pages/admin/AdminLayout'
import { AdminMarketplacePage } from './pages/admin/AdminMarketplacePage'
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage'
import { AdminTeamsPage } from './pages/admin/AdminTeamsPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'

function AdminRouteShell() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <AdminLayout />
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AdminProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/mi-equipo"
                element={
                  <ProtectedRoute allowedRoles={['estudiante']}>
                    <StudentTeamPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketplace"
                element={
                  <ProtectedRoute allowedRoles={['estudiante']}>
                    <MarketplacePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin" element={<AdminRouteShell />}>
                <Route index element={<AdminHomePage />} />
                <Route path="estudiantes" element={<AdminStudentsPage />} />
                <Route path="equipos" element={<AdminTeamsPage />} />
                <Route path="marketplace" element={<AdminMarketplacePage />} />
                <Route path="calificacion" element={<AdminCalificacionPage />} />
                <Route path="helios" element={<AdminHeliosPage />} />
                <Route
                  path="usuarios"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route
                path="/calificar"
                element={
                  <ProtectedRoute allowedRoles={['juez']}>
                    <JudgePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/helios" element={<HeliosPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AdminProvider>
      </AuthProvider>
    </NotificationProvider>
  )
}
