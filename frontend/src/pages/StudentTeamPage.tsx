import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogoLink } from '../components/Logo'
import { UserAvatar } from '../components/UserAvatar'
import { useAuth } from '../context/AuthContext'
import { ApiError, mapApiErrorToSpanish } from '../lib/api'
import {
  getMiEquipoStudent,
  renombrarEquipo,
  type MiEquipoResponse,
} from '../lib/studentTeamApi'

function GradoBadge({ grado }: { grado: number | null }) {
  if (!grado) return null
  return (
    <span className="rounded-full border border-[#e3ecf7] bg-[#f6f9ff] px-2 py-0.5 font-mono text-[11px] text-muted">
      {grado}.°
    </span>
  )
}

function SinEquipoState() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e3ecf7] bg-white shadow-sm">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9aa3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <h2 className="mb-2 font-display text-xl font-bold text-navy">Aún no tienes equipo</h2>
      <p className="max-w-sm text-sm leading-relaxed text-muted">
        El administrador asignará los equipos pronto. Vuelve a esta página cuando te hayan asignado uno.
      </p>
    </div>
  )
}

function RenombrarForm({
  equipoNombre,
  onSaved,
}: {
  equipoNombre: string
  onSaved: (equipo: MiEquipoResponse) => void
}) {
  const [nombre, setNombre] = useState(equipoNombre)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (nombre.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await renombrarEquipo(nombre.trim())
      onSaved(updated)
    } catch (err) {
      setError(err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo guardar.') : 'Error de conexión.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
      <div>
        <label className="mb-1.5 block font-display text-[13px] font-semibold text-navy">
          Nombre del equipo
        </label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          minLength={3}
          required
          className="w-full rounded-xl border border-[#cdd9ec] px-3.5 py-2.5 text-sm text-navy outline-none focus:border-accent"
          placeholder="Ej: Los Inventores"
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={saving}
        className="accent-gradient w-full rounded-xl py-3 font-display text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(47,107,224,0.8)] disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {saving ? 'Guardando…' : 'Confirmar nombre'}
      </button>
    </form>
  )
}

export function StudentTeamPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [equipo, setEquipo] = useState<MiEquipoResponse | null>(null)
  const [sinEquipo, setSinEquipo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMiEquipoStudent()
      setEquipo(data)
      setSinEquipo(false)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setSinEquipo(true)
      } else {
        setError('No se pudo cargar tu equipo.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const necesitaNombre = equipo?.es_lider && !equipo.nombre_confirmado

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 border-b border-[#dde7f4] bg-white/90 backdrop-blur-md">
        <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
          <LogoLink height={28} />
          <nav className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link to="/marketplace" className="font-display text-[13px] font-semibold text-[#3a4868] hover:text-navy">
              Marketplace
            </Link>
            {user && <UserAvatar name={user.nombre_completo} />}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-xl border border-[#cdd9ec] px-3 py-2 font-display text-[13px] font-semibold text-navy hover:bg-[#f1f5fb]"
            >
              Salir
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">Mi Equipo</h1>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="flex h-9 shrink-0 items-center rounded-xl border border-[#cdd9ec] bg-white px-3.5 font-display text-sm font-semibold text-[#3a4868] disabled:opacity-60"
          >
            {loading ? 'Cargando…' : 'Actualizar'}
          </button>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {loading && !equipo && !sinEquipo ? (
          <p className="py-16 text-center text-sm text-muted">Cargando…</p>
        ) : sinEquipo ? (
          <SinEquipoState />
        ) : equipo ? (
          <div className="space-y-5">

            {/* Banner: líder debe confirmar nombre */}
            {necesitaNombre && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <p className="font-display text-sm font-bold text-amber-800">
                  Debes confirmar el nombre de tu equipo antes de poder acceder al marketplace.
                </p>
                <p className="mt-0.5 text-sm text-amber-700">
                  Ponle un nombre a tu equipo aquí abajo y haz clic en Confirmar.
                </p>
              </div>
            )}

            {/* Card equipo */}
            <div className="rounded-2xl border border-[#e3ecf7] bg-white p-6 shadow-[0_1px_2px_rgba(1,40,84,0.04),0_14px_32px_-26px_rgba(1,40,84,0.3)]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Tu equipo</p>
                  <h2 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-navy">
                    {equipo.equipo_nombre}
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {equipo.es_lider && (
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-display text-xs font-bold text-accent">
                      Líder
                    </span>
                  )}
                  {equipo.nombre_confirmado && (
                    <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 font-display text-xs font-semibold text-green-700">
                      Nombre confirmado
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#f6f9ff] px-4 py-3">
                <span className="font-display text-[13px] font-semibold text-muted">Presupuesto</span>
                <span className="ml-auto font-mono text-xl font-bold text-accent">{equipo.presupuesto.toLocaleString()}</span>
              </div>

              {/* Miembros */}
              <div>
                <p className="mb-3 font-display text-[13px] font-semibold text-muted">
                  Integrantes ({equipo.miembros.length})
                </p>
                <div className="space-y-2">
                  {equipo.miembros.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 rounded-xl border border-[#f1f3f7] px-3.5 py-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef4fd] font-display text-sm font-bold text-accent">
                        {m.nombre_completo.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy">{m.nombre_completo}</p>
                        <p className="truncate text-xs text-muted">{m.colegio ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <GradoBadge grado={m.grado} />
                        {m.es_lider && (
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 font-display text-[10px] font-bold text-accent">
                            Líder
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Formulario renombrar (solo líder) */}
            {equipo.es_lider && (
              <div className="rounded-2xl border border-[#e3ecf7] bg-white p-6">
                <h3 className="mb-4 font-display text-base font-bold text-navy">
                  {equipo.nombre_confirmado ? 'Cambiar nombre del equipo' : 'Confirmar nombre del equipo'}
                </h3>
                <RenombrarForm
                  equipoNombre={equipo.equipo_nombre}
                  onSaved={(updated) => setEquipo(updated)}
                />
              </div>
            )}

            {/* Acceso al marketplace */}
            {equipo.nombre_confirmado && (
              <Link
                to="/marketplace"
                className="accent-gradient flex h-12 w-full items-center justify-center rounded-2xl font-display text-sm font-bold text-white shadow-[0_10px_24px_-14px_rgba(47,107,224,0.8)]"
              >
                Ir al Marketplace
              </Link>
            )}

          </div>
        ) : null}
      </main>
    </div>
  )
}
