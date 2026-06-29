import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoLink } from '../components/Logo'
import { UserAvatar } from '../components/UserAvatar'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { ApiError, mapApiErrorToSpanish } from '../lib/api'
import type { CriterioResponse } from '../lib/adminCalificacionApi'
import {
  enviarCalificacion,
  getCriterios,
  getMisEquipos,
  type EquipoAsignadoResponse,
} from '../lib/judgeApi'

// ── Formulario de calificación por equipo ──────────────────────────────────────

function CalificacionForm({
  equipo,
  criterios,
  abierta,
  onEnviada,
}: {
  equipo: EquipoAsignadoResponse
  criterios: CriterioResponse[]
  abierta: boolean
  onEnviada: (updated: EquipoAsignadoResponse) => void
}) {
  const { notify } = useNotification()
  const [expanded, setExpanded] = useState(false)
  const [puntajes, setPuntajes] = useState<Record<string, string>>({})
  const [comentario, setComentario] = useState('')
  const [sending, setSending] = useState(false)

  const enviada = equipo.calificacion !== null
  const totalMax = criterios.reduce((s, c) => s + c.puntaje_maximo, 0)
  const totalActual = Object.values(puntajes).reduce((s, v) => s + (Number(v) || 0), 0)

  function handleChange(criterioId: string, val: string) {
    setPuntajes(prev => ({ ...prev, [criterioId]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    for (const c of criterios) {
      const v = Number(puntajes[c.id] ?? 0)
      if (v < 0 || v > c.puntaje_maximo) {
        notify({ type: 'error', title: 'Puntaje inválido', message: `"${c.nombre}": máximo es ${c.puntaje_maximo}.` })
        return
      }
    }
    setSending(true)
    try {
      const cal = await enviarCalificacion(
        equipo.equipo_id,
        criterios.map(c => ({ criterio_id: c.id, puntaje: Number(puntajes[c.id] ?? 0) })),
        comentario || undefined,
      )
      onEnviada({ ...equipo, calificacion: cal })
      notify({ type: 'success', title: '¡Calificación enviada!', message: `Total: ${cal.total} / ${totalMax}` })
      setExpanded(false)
    } catch (err) {
      notify({
        type: 'error',
        title: 'No se pudo enviar',
        message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'Error al enviar.') : 'Error de conexión.',
      })
    } finally { setSending(false) }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e3ecf7] bg-white shadow-[0_1px_2px_rgba(1,40,84,0.04),0_10px_24px_-20px_rgba(1,40,84,0.2)]">
      {/* Header de la tarjeta */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#f8fafd]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef4fd] font-display text-base font-bold text-accent">
            {equipo.equipo_nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-display text-[15px] font-bold text-navy">{equipo.equipo_nombre}</p>
            {enviada && equipo.calificacion && (
              <p className="text-[12px] text-muted">
                Total enviado: <span className="font-semibold text-accent">{equipo.calificacion.total}</span> / {totalMax}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {enviada ? (
            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 font-display text-[11px] font-bold text-green-700">
              Enviada ✓
            </span>
          ) : (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-display text-[11px] font-semibold text-amber-700">
              Pendiente
            </span>
          )}
          {!enviada && (
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#9aa3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          )}
        </div>
      </button>

      {/* Detalle calificación ya enviada */}
      {enviada && equipo.calificacion && expanded && (
        <div className="border-t border-[#f1f3f7] px-5 py-4">
          <div className="space-y-2">
            {equipo.calificacion.puntajes.map(p => (
              <div key={p.criterio_id} className="flex items-center justify-between gap-3">
                <span className="text-sm text-navy">{p.criterio_nombre ?? '—'}</span>
                <span className="font-mono text-sm font-semibold text-accent">
                  {p.puntaje} / {p.puntaje_maximo ?? '?'}
                </span>
              </div>
            ))}
            {equipo.calificacion.comentario && (
              <p className="mt-3 rounded-xl bg-[#f6f9ff] px-3.5 py-2.5 text-sm text-[#46557a]">
                {equipo.calificacion.comentario}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Formulario para calificar */}
      {!enviada && expanded && (
        <form onSubmit={e => void handleSubmit(e)} className="border-t border-[#f1f3f7] px-5 py-4">
          {!abierta && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
              <p className="text-sm font-semibold text-amber-700">La fase de calificación está cerrada — no puedes enviar ahora.</p>
            </div>
          )}

          <div className="mb-4 space-y-3">
            {criterios.map(c => (
              <div key={c.id}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="font-display text-[13px] font-semibold text-navy">{c.nombre}</label>
                  <span className="font-mono text-[11px] text-muted">máx. {c.puntaje_maximo}</span>
                </div>
                {c.descripcion && <p className="mb-1.5 text-[12px] text-muted">{c.descripcion}</p>}
                <input
                  type="number"
                  min={0}
                  max={c.puntaje_maximo}
                  value={puntajes[c.id] ?? ''}
                  onChange={e => handleChange(c.id, e.target.value)}
                  placeholder="0"
                  disabled={!abierta}
                  className="w-full rounded-xl border border-[#cdd9ec] px-3.5 py-2.5 text-sm text-navy outline-none focus:border-accent disabled:bg-[#f8fafd] disabled:text-muted"
                  required
                />
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block font-display text-[13px] font-semibold text-navy">
              Comentario <span className="font-normal text-muted">(opcional)</span>
            </label>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              disabled={!abierta}
              rows={2}
              className="w-full resize-none rounded-xl border border-[#cdd9ec] px-3.5 py-2.5 text-sm text-navy outline-none focus:border-accent disabled:bg-[#f8fafd]"
              placeholder="Observaciones generales…"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-sm text-muted">
              Total: <span className="font-bold text-navy">{totalActual}</span> / {totalMax}
            </p>
            <button
              type="submit"
              disabled={!abierta || sending}
              className="accent-gradient rounded-xl px-6 py-2.5 font-display text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(47,107,224,0.8)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Enviando…' : 'Enviar calificación'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Página del juez ────────────────────────────────────────────────────────────

export function JudgePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [equipos, setEquipos] = useState<EquipoAsignadoResponse[]>([])
  const [criterios, setCriterios] = useState<CriterioResponse[]>([])
  const [abierta, setAbierta] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [mis, crit, statusRes] = await Promise.all([
        getMisEquipos(),
        getCriterios(),
        fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'}/calificacion/status`)
          .then(r => r.json()) as Promise<{ calificacion_abierta: boolean }>,
      ])
      setEquipos(mis)
      setCriterios(crit)
      setAbierta(statusRes.calificacion_abierta)
    } catch {
      setError('No se pudo cargar la página de calificación.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  function handleEnviada(updated: EquipoAsignadoResponse) {
    setEquipos(prev => prev.map(e => e.equipo_id === updated.equipo_id ? updated : e))
  }

  const pendientes = equipos.filter(e => !e.calificacion).length
  const enviadas = equipos.filter(e => e.calificacion).length

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 border-b border-[#dde7f4] bg-white/90 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <LogoLink height={28} />
          <span className="hidden font-display text-sm font-semibold text-muted sm:inline">Juez</span>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {user && <UserAvatar name={user.nombre_completo} />}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-xl border border-[#cdd9ec] px-3 py-2 font-display text-[13px] font-semibold text-navy hover:bg-[#f1f5fb]"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">
            Calificación
          </h1>
          {user && (
            <p className="mt-0.5 text-sm text-muted">
              Hola, <span className="font-semibold text-navy">{user.nombre_completo}</span>
            </p>
          )}
        </div>

        {/* Status banner */}
        {!abierta && !loading && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="font-display text-sm font-bold text-amber-800">
              La fase de calificación no está abierta aún.
            </p>
            <p className="mt-0.5 text-sm text-amber-700">
              Puedes ver tus equipos asignados, pero no podrás enviar hasta que el administrador abra la fase.
            </p>
          </div>
        )}

        {/* Progreso */}
        {equipos.length > 0 && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#e3ecf7] bg-white px-5 py-3.5">
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="font-display text-[13px] font-semibold text-muted">Progreso</p>
                <p className="font-mono text-[13px] font-bold text-accent">{enviadas}/{equipos.length}</p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#e8eef8]">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${(enviadas / equipos.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {loading ? (
          <p className="py-16 text-center text-sm text-muted">Cargando…</p>
        ) : equipos.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="font-display text-lg font-bold text-navy">Sin equipos asignados</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              El administrador aún no te ha asignado equipos para calificar.
            </p>
          </div>
        ) : criterios.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="font-display text-lg font-bold text-navy">Rúbrica pendiente</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              El administrador no ha definido los criterios de calificación todavía.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {equipos.map(e => (
              <CalificacionForm
                key={e.equipo_id}
                equipo={e}
                criterios={criterios}
                abierta={abierta}
                onEnviada={handleEnviada}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
