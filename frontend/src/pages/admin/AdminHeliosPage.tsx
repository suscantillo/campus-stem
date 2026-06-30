import { useCallback, useEffect, useState } from 'react'
import { ApiError, mapApiErrorToSpanish } from '../../lib/api'
import {
  getAdminHelios,
  resetAll,
  resetEquipo,
  type AdminEquipoSummary,
  type AdminHeliosResponse,
} from '../../lib/heliosApi'
import { useNotification } from '../../context/NotificationContext'

function StatusBadge({ equipo }: { equipo: AdminEquipoSummary }) {
  if (equipo.completado)
    return <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 font-display text-[11px] font-bold text-green-700">Completado ✓</span>
  if (equipo.iniciado)
    return <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-display text-[11px] font-semibold text-amber-700">En progreso</span>
  return <span className="rounded-full border border-[#e3ecf7] bg-[#f8fafd] px-2.5 py-0.5 font-display text-[11px] text-muted">Sin iniciar</span>
}

export function AdminHeliosPage() {
  const { notify } = useNotification()
  const [data, setData] = useState<AdminHeliosResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await getAdminHelios()) }
    catch { notify({ type: 'error', title: 'Error', message: 'No se pudo cargar el estado del escape room.' }) }
    finally { setLoading(false) }
  }, [notify])

  useEffect(() => { void load() }, [load])

  // Auto-refresh every 20s during event
  useEffect(() => {
    const id = setInterval(() => void load(), 20_000)
    return () => clearInterval(id)
  }, [load])

  async function handleResetEquipo(equipo_id: string, nombre: string) {
    if (!window.confirm(`¿Resetear el progreso de "${nombre}"? Perderán todas las estaciones completadas.`)) return
    setResetting(equipo_id)
    try {
      await resetEquipo(equipo_id)
      notify({ type: 'success', title: 'Reseteado', message: `Progreso de ${nombre} eliminado.` })
      await load()
    } catch (err) {
      notify({ type: 'error', title: 'Error', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'Error al resetear.') : 'Error.' })
    } finally { setResetting(null) }
  }

  async function handleResetAll() {
    if (!window.confirm('¿Resetear el progreso de TODOS los equipos? Esta acción no se puede deshacer.')) return
    setResetting('all')
    try {
      await resetAll()
      notify({ type: 'success', title: 'Reseteado', message: 'Progreso de todos los equipos eliminado.' })
      await load()
    } catch (err) {
      notify({ type: 'error', title: 'Error', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'Error al resetear.') : 'Error.' })
    } finally { setResetting(null) }
  }

  if (loading && !data) return <p className="py-8 text-center text-sm text-muted">Cargando…</p>
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Completados', value: data.completados, color: '#22c55e' },
          { label: 'En progreso', value: data.en_progreso, color: '#f59e0b' },
          { label: 'Sin iniciar', value: data.sin_iniciar, color: '#9aa3b8' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-[#e3ecf7] bg-white p-4 shadow-[0_1px_2px_rgba(1,40,84,0.04)]">
            <p className="mb-2 font-display text-[12px] font-semibold text-muted">{k.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="h-2 w-2 rounded-[2px]" style={{ background: k.color }} />
              <span className="font-display text-3xl font-bold leading-none tracking-tight text-navy">{k.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Header actions */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-bold text-navy">Estado por equipo</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-[#cdd9ec] px-4 py-2 font-display text-[13px] font-semibold text-navy hover:bg-[#f1f5fb]"
          >
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => void handleResetAll()}
            disabled={resetting === 'all'}
            className="rounded-xl border border-red-200 px-4 py-2 font-display text-[13px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {resetting === 'all' ? 'Reseteando…' : 'Reset todo'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e3ecf7] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[#f1f3f7] bg-navy">
                {['#', 'Equipo', 'Ruta', 'Progreso', 'Estación actual', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-display text-[11px] font-semibold uppercase tracking-wider text-[#5aa9e6]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.equipos.map(e => (
                <tr key={e.equipo_id} className="border-t border-[#f1f3f7] hover:bg-[#f8fafd]">
                  <td className="px-4 py-3 font-mono text-sm text-muted">{e.numero}</td>
                  <td className="px-4 py-3">
                    <p className="font-display text-sm font-bold text-navy">{e.nombre}</p>
                  </td>
                  <td className="px-4 py-3 font-display text-[12px] text-muted">{e.ruta_nombre}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#e8eef8]">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${e.porcentaje}%` }}
                        />
                      </div>
                      <span className="font-mono text-[12px] font-semibold text-accent">
                        {e.fragmentos_obtenidos}/{e.total_fragmentos}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-display text-[12px] text-navy">
                    {e.completado ? '—' : e.estacion_actual_nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge equipo={e} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void handleResetEquipo(e.equipo_id, e.nombre)}
                      disabled={resetting === e.equipo_id || (!e.iniciado && !e.completado)}
                      className="rounded-lg border border-[#cdd9ec] px-2.5 py-1 font-display text-[11px] text-muted hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Codes reference */}
      <details className="rounded-2xl border border-[#e3ecf7] bg-white p-5">
        <summary className="cursor-pointer font-display text-sm font-semibold text-navy">
          Códigos de acceso (entregar a cada equipo)
        </summary>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {data.equipos.map(e => (
            <div key={e.equipo_id} className="rounded-xl border border-[#e3ecf7] bg-[#f8fafd] p-3 text-center">
              <p className="font-display text-[11px] font-semibold text-muted">{e.nombre}</p>
              <p className="font-mono text-base font-bold tracking-widest text-accent">
                {/* Render code from equipo_id mapping */}
                {CODIGO_MAP[e.equipo_id]}
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}

// Inline codes map (same as backend data)
const CODIGO_MAP: Record<string, string> = {
  voltios: 'VOLT', tesla: 'TESL', maxwell: 'MAXW', faraday: 'FARD',
  edison: 'EDIS', kirchhoff: 'KIRC', ampere: 'AMPE', ohm: 'OHMM',
  watt: 'WATT', gauss: 'GAUS',
}
