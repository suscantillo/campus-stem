import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminProvider } from './context/AdminContext'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { AdminHomePage, AdminLayout } from './pages/admin/AdminLayout'
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
              <Route path="/admin" element={<AdminRouteShell />}>
                <Route index element={<AdminHomePage />} />
                <Route path="estudiantes" element={<AdminStudentsPage />} />
                <Route path="equipos" element={<AdminTeamsPage />} />
                <Route
                  path="usuarios"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AdminProvider>
      </AuthProvider>
    </NotificationProvider>
  )
}
