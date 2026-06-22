import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogoLink } from '../../components/Logo'
import { useAdmin } from '../../context/AdminContext'

const navItems = [
  { to: '/admin', label: 'Inicio / Resumen', end: true },
  { to: '/admin/estudiantes', label: 'Estudiantes', end: false },
  { to: '/admin/equipos', label: 'Equipos', end: false },
]

const disabledNav = [
  'Marketplace',
  'Presupuestos',
  'Calificación',
  'Resultados',
  'Control del evento',
]

const titles: Record<string, string> = {
  '/admin': 'Inicio / Resumen',
  '/admin/estudiantes': 'Estudiantes',
  '/admin/equipos': 'Equipos',
}

export function AdminLayout() {
  const navigate = useNavigate()
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
          <LogoLink to="/" size="sm" />
        </div>
        <p className="mb-2.5 px-2 font-mono text-[10px] tracking-wide text-[#5e6f96]">
          // NAVEGACIÓN
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `mb-0.5 rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'accent-gradient font-semibold text-navy'
                  : 'text-[#aeb8cc] hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        {disabledNav.map((label) => (
          <div
            key={label}
            className="mb-0.5 cursor-not-allowed rounded-md px-3.5 py-2.5 text-sm font-medium text-[#aeb8cc] opacity-45"
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
          <h1 className="text-[19px] font-bold tracking-tight text-navy">{title}</h1>
          <div className="ml-auto flex items-center gap-3.5">
            <span className="rounded-full border border-accent-alt px-3 py-1.5 font-mono text-[11px] tracking-wide text-navy">
              ADMIN
            </span>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="cursor-pointer rounded-md border border-border px-4 py-2 font-mono text-xs text-navy"
            >
              SALIR
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
    { label: 'ESTUDIANTES', value: String(admin.studentCount), accent: '#faa500' },
    { label: 'EQUIPOS', value: String(admin.teamCount), accent: '#edb501' },
    { label: 'PRODUCTOS', value: String(admin.productCount), accent: '#ffde59' },
    { label: 'CALIFICACIÓN', value: '—', accent: '#012854' },
  ]

  const gates = [
    {
      title: 'Registro de estudiantes',
      status: admin.registroOpen ? 'HABILITADO' : 'DESHABILITADO',
      checked: admin.registroOpen,
      toggle: admin.toggleRegistro,
    },
    {
      title: 'Marketplace',
      status: admin.marketplaceOpen ? 'ABIERTO' : 'CERRADO',
      checked: admin.marketplaceOpen,
      toggle: admin.toggleMarketplace,
    },
    {
      title: 'Calificación',
      status: admin.calificacionOpen ? 'ABIERTA' : 'CERRADA',
      checked: admin.calificacionOpen,
      toggle: admin.toggleCalificacion,
    },
  ]

  return (
    <>
      <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-[10px] border border-[#e3e7ef] bg-white p-5">
            <p className="mb-3.5 font-mono text-[11px] tracking-wide text-[#8a96ad]">
              {kpi.label}
            </p>
            <div className="flex items-baseline gap-2.5">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: kpi.accent }}
              />
              <span className="text-[38px] leading-none font-bold tracking-tight text-navy">
                {kpi.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 rounded-[10px] border border-[#e3e7ef] bg-white p-6">
        <h2 className="text-[21px] font-bold tracking-tight text-navy">Control del evento</h2>
        <p className="mt-1 mb-5 font-mono text-[11px] tracking-wide text-[#9aa3b8]">
          // COMPUERTAS INDEPENDIENTES
        </p>
        {gates.map((gate) => (
          <div
            key={gate.title}
            className="flex items-center gap-4 border-t border-[#f1f3f7] py-4"
          >
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-navy">{gate.title}</p>
              <p className="mt-0.5 font-mono text-[11px] text-[#9aa3b8]">{gate.status}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={gate.checked}
              aria-label={gate.title}
              onClick={gate.toggle}
              className={`relative h-6 w-[46px] shrink-0 rounded-full transition-colors ${
                gate.checked ? 'accent-gradient' : 'bg-[#cfd5e0]'
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
        <p className="mb-3.5 font-mono text-[11px] tracking-wide text-[#8a96ad]">
          // ACCESOS RÁPIDOS
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/equipos')}
            className="accent-gradient cursor-pointer rounded-md px-5 py-3.5 font-mono text-[13px] font-semibold text-navy"
          >
            GENERAR EQUIPOS
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-md border border-border bg-white px-5 py-3.5 font-mono text-[13px] text-navy opacity-50"
          >
            AGREGAR PRODUCTO
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-md border border-border bg-white px-5 py-3.5 font-mono text-[13px] text-navy opacity-50"
          >
            DESCARGAR RESULTADOS
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
