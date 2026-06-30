import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogoLink } from '../../components/Logo'
import { useAdmin } from '../../context/AdminContext'
import { useAuth } from '../../context/AuthContext'
import { isAdminRole, isSuperAdmin } from '../../lib/auth'

const baseNavItems = [
  { to: '/admin', label: 'Inicio / Resumen', end: true },
  { to: '/admin/estudiantes', label: 'Estudiantes', end: false },
  { to: '/admin/equipos', label: 'Equipos', end: false },
  { to: '/admin/marketplace', label: 'Marketplace', end: false },
  { to: '/admin/calificacion', label: 'Calificación', end: false },
  { to: '/admin/helios', label: 'Escape Room', end: false },
]

const superAdminNavItems = [{ to: '/admin/usuarios', label: 'Usuarios', end: false }]

const disabledNav: string[] = []

const titles: Record<string, string> = {
  '/admin': 'Inicio / Resumen',
  '/admin/estudiantes': 'Estudiantes',
  '/admin/equipos': 'Equipos',
  '/admin/marketplace': 'Marketplace',
  '/admin/calificacion': 'Calificación',
  '/admin/helios': 'Escape Room — HELIOS',
  '/admin/usuarios': 'Usuarios privilegiados',
}

export function AdminLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    const onResize = () => {
      const narrow = window.innerWidth < 860
      setIsNarrow(narrow)
      if (!narrow) setSidebarOpen(false)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Admin'
  const roleLabel =
    user && isAdminRole(user.rol) ? user.rol.toUpperCase().replaceAll('_', ' ') : 'ADMIN'

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const navItems = user && isSuperAdmin(user.rol)
    ? [...baseNavItems, ...superAdminNavItems]
    : baseNavItems

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-surface">
      {isNarrow && sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="absolute inset-0 z-[15] bg-[rgba(1,40,84,0.45)]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`grid-sidebar z-20 flex w-56 shrink-0 flex-col px-3 py-4 ${
          isNarrow
            ? `absolute top-0 bottom-0 left-0 transition-transform ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              } shadow-[2px_0_18px_rgba(1,40,84,0.4)]`
            : ''
        }`}
      >
        <div className="mb-4 border-b border-white/10 px-2 pb-4">
          <LogoLink to="/" height={32} onDark />
        </div>
        <p className="mb-2.5 px-2 font-mono text-[10px] tracking-[1px] text-[#5e6f96]">
          NAVEGACIÓN
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `mb-0.5 rounded-xl px-3.5 py-2.5 font-display text-sm transition-colors ${
                isActive
                  ? 'accent-gradient font-bold text-white'
                  : 'font-semibold text-[#aebfdc] hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        {disabledNav.map((label) => (
          <div
            key={label}
            className="mb-0.5 cursor-not-allowed rounded-xl px-3.5 py-2.5 font-display text-sm font-semibold text-[#aebfdc] opacity-45"
          >
            {label}
          </div>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <header className="sticky top-0 z-[5] flex items-center gap-3.5 border-b border-[#e7eaf1] bg-white/90 px-6 py-4 backdrop-blur-md md:px-7">
          {isNarrow && (
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setSidebarOpen(true)}
              className="flex h-[38px] w-[38px] flex-col items-center justify-center gap-1 rounded-md border border-border"
            >
              <span className="h-0.5 w-4 bg-navy" />
              <span className="h-0.5 w-4 bg-navy" />
              <span className="h-0.5 w-4 bg-navy" />
            </button>
          )}
          <h1 className="font-display text-xl font-bold tracking-[-0.3px] text-navy">{title}</h1>
          <div className="ml-auto flex items-center gap-3.5">
            <span className="rounded-full border border-[#c7daf5] bg-[#eef4fd] px-3.5 py-1.5 font-display text-xs font-semibold text-accent">
              {roleLabel}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer rounded-xl border border-border px-4 py-2 font-display text-[13px] font-semibold text-navy transition-colors hover:bg-[#f1f5fb]"
            >
              Salir
            </button>
          </div>
        </header>

        <main className="max-w-[1020px] px-6 py-7 pb-15 md:px-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AdminHomePage() {
  const admin = useAdmin()
  const navigate = useNavigate()

  const kpis = [
    { label: 'Estudiantes', value: String(admin.studentCount), accent: '#2f6be0' },
    { label: 'Equipos', value: String(admin.teamCount), accent: '#3fa0e8' },
    { label: 'Productos', value: String(admin.productCount), accent: '#5aa9e6' },
    { label: 'Calificación', value: '—', accent: '#012854' },
  ]

  const gates = [
    {
      title: 'Registro de estudiantes',
      status: admin.registroLoading
        ? 'Cargando…'
        : admin.registroOpen
          ? 'Habilitado'
          : 'Deshabilitado',
      checked: admin.registroOpen,
      toggle: () => void admin.toggleRegistro(),
      disabled: admin.registroLoading || admin.registroToggling,
    },
    {
      title: 'Marketplace',
      status: admin.marketplaceLoading
        ? 'Cargando…'
        : admin.marketplaceOpen
          ? 'Abierto'
          : 'Cerrado',
      checked: admin.marketplaceOpen,
      toggle: () => void admin.toggleMarketplace(),
      disabled: admin.marketplaceLoading || admin.marketplaceToggling,
    },
    {
      title: 'Calificación',
      status: admin.calificacionOpen ? 'Abierta' : 'Cerrada',
      checked: admin.calificacionOpen,
      toggle: () => void admin.toggleCalificacion(),
      disabled: admin.calificacionToggling,
    },
  ]

  return (
    <>
      <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-[#e3ecf7] bg-white p-5 shadow-[0_1px_2px_rgba(1,40,84,0.04),0_14px_32px_-26px_rgba(1,40,84,0.3)]"
          >
            <p className="mb-3.5 font-display text-[13px] font-semibold text-[#8a96ad]">
              {kpi.label}
            </p>
            <div className="flex items-baseline gap-2.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: kpi.accent }} />
              <span className="font-display text-[38px] leading-none font-bold tracking-[-1px] text-navy">
                {kpi.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 rounded-2xl border border-[#e3ecf7] bg-white p-6 shadow-[0_1px_2px_rgba(1,40,84,0.04),0_18px_40px_-30px_rgba(1,40,84,0.35)]">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.3px] text-navy">
          Control del evento
        </h2>
        <p className="mt-1 mb-5 font-display text-[13px] font-medium text-[#9aa3b8]">
          Compuertas independientes — no es un flujo lineal
        </p>
        {admin.registroError ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {admin.registroError}
          </p>
        ) : null}
        {gates.map((gate) => (
          <div
            key={gate.title}
            className="flex items-center gap-4 border-t border-[#eef2f8] py-4"
          >
            <div className="flex-1">
              <p className="font-display text-base font-semibold text-navy">{gate.title}</p>
              <p className="mt-0.5 font-mono text-[11px] text-[#9aa3b8]">{gate.status}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={gate.checked}
              aria-label={gate.title}
              disabled={gate.disabled}
              onClick={gate.toggle}
              className={`relative h-6 w-[46px] shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                gate.checked ? 'accent-gradient' : 'bg-[#cdd9ec]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  gate.checked ? 'translate-x-[22px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-3.5 font-display text-lg font-bold text-navy">Accesos rápidos</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/equipos')}
            className="accent-gradient cursor-pointer rounded-xl px-[22px] py-3.5 font-display text-sm font-bold text-white shadow-[0_10px_24px_-14px_rgba(47,107,224,0.8)]"
          >
            Generar equipos
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/marketplace')}
            className="cursor-pointer rounded-xl border border-[#cdd9ec] bg-white px-[22px] py-3.5 font-display text-sm font-semibold text-navy hover:bg-[#f1f5fb]"
          >
            Agregar producto
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/calificacion')}
            className="cursor-pointer rounded-xl border border-[#cdd9ec] bg-white px-[22px] py-3.5 font-display text-sm font-semibold text-navy hover:bg-[#f1f5fb]"
          >
            Ver resultados
          </button>
        </div>
      </div>

      <p className="mt-8 text-sm text-muted">
        El toggle de registro afecta la página pública de{' '}
        <Link to="/registro" className="font-semibold text-navy underline">
          /registro
        </Link>
        .
      </p>
    </>
  )
}
