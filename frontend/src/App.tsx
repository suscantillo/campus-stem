import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminProvider } from './context/AdminContext'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { AdminHomePage, AdminLayout } from './pages/admin/AdminLayout'
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage'
import { AdminTeamsPage } from './pages/admin/AdminTeamsPage'

export default function App() {
  return (
    <AdminProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminHomePage />} />
            <Route path="estudiantes" element={<AdminStudentsPage />} />
            <Route path="equipos" element={<AdminTeamsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminProvider>
  )
}
