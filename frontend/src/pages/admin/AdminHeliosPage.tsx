import { useCallback, useEffect, useState } from 'react'
import { ApiError, mapApiErrorToSpanish } from '../../lib/api'
import {
  getAdminHelios,
  resetAll,
  resetEquipo,
  listHeliosEquipos,
  createHeliosEquipo,
  deleteHeliosEquipo,
  addHeliosMiembro,
  removeHeliosMiembro,
  setHeliosLider,
  getEstudiantesDisponibles,
  type AdminEquipoSummary,
  type AdminHeliosResponse,
  type HeliosEquipoAdmin,
  type EstudianteDisponible,
} from '../../lib/heliosApi'
import { useNotification } from '../../context/NotificationContext'
import { useAdmin } from '../../context/AdminContext'
import { Toggle } from '../../components/Toggle'

const NOMBRES_EQUIPOS = [
  { id: 'voltios', nombre: 'Voltios', ruta: 'Ruta Solar' },
  { id: 'tesla', nombre: 'Tesla', ruta: 'Ruta Solar' },
  { id: 'maxwell', nombre: 'Maxwell', ruta: 'Ruta Eléctrica' },
  { id: 'faraday', nombre: 'Faraday', ruta: 'Ruta Eléctrica' },
  { id: 'edison', nombre: 'Edison', ruta: 'Ruta Electrónica' },
  { id: 'kirchhoff', nombre: 'Kirchhoff', ruta: 'Ruta Electrónica' },
  { id: 'ampere', nombre: 'Ampere', ruta: 'Ruta Renovable' },
  { id: 'ohm', nombre: 'Ohm', ruta: 'Ruta Renovable' },
  { id: 'watt', nombre: 'Watt', ruta: 'Ruta de Investigación' },
  { id: 'gauss', nombre: 'Gauss', ruta: 'Ruta de Investigación' },
]

function StatusBadge({ equipo }: { equipo: AdminEquipoSummary }) {
  if (equipo.completado)
    return <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 font-display text-[11px] font-bold text-green-700">Completado ✓</span>
  if (equipo.iniciado)
    return <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-display text-[11px] font-semibold text-amber-700">En progreso</span>
  return <span className="rounded-full border border-[#e3ecf7] bg-[#f8fafd] px-2.5 py-0.5 font-display text-[11px] text-muted">Sin iniciar</span>
}

// ── Equipos Tab ────────────────────────────────────────────────────────────────

function EquiposTab() {
  const { notify } = useNotification()
  const [equipos, setEquipos] = useState<HeliosEquipoAdmin[]>([])
  const [disponibles, setDisponibles] = useState<EstudianteDisponible[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [selectedNombre, setSelectedNombre] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [addMiembroEquipoId, setAddMiembroEquipoId] = useState<string | null>(null)
  const [selectedUsuario, setSelectedUsuario] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [eq, disp] = await Promise.all([listHeliosEquipos(), getEstudiantesDisponibles()])
      setEquipos(eq)
      setDisponibles(disp)
    } catch {
      notify({ type: 'error', title: 'Error', message: 'No se pudo cargar los equipos.' })
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => { void load() }, [load])

  const createdNombreIds = new Set(equipos.map(e => e.nombre_id))
  const nombresDisponibles = NOMBRES_EQUIPOS.filter(n => !createdNombreIds.has(n.id))

  async function handleCreate() {
    if (!selectedNombre) return
    setCreating(true)
    try {
      await createHeliosEquipo(selectedNombre)
      notify({ type: 'success', title: 'Equipo creado', message: `Equipo "${selectedNombre}" creado.` })
      setSelectedNombre('')
      await load()
    } catch (err) {
      notify({ type: 'error', title: 'Error', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo crear el equipo.') : 'Error.' })
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar el equipo "${nombre}"? Esta acción no se puede deshacer.`)) return
    setActionLoading(id)
    try {
      await deleteHeliosEquipo(id)
      notify({ type: 'success', title: 'Equipo eliminado', message: `Equipo "${nombre}" eliminado.` })
      await load()
    } catch (err) {
      notify({ type: 'error', title: 'Error', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo eliminar.') : 'Error.' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRemoveMiembro(equipoId: string, usuarioId: string, nombre: string) {
    setActionLoading(`rm-${equipoId}-${usuarioId}`)
    try {
      await removeHeliosMiembro(equipoId, usuarioId)
      notify({ type: 'success', title: 'Miembro removido', message: `${nombre} fue removido del equipo.` })
      await load()
    } catch (err) {
      notify({ type: 'error', title: 'Error', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo remover.') : 'Error.' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleSetLider(equipoId: string, usuarioId: string, nombre: string) {
    setActionLoading(`lider-${equipoId}-${usuarioId}`)
    try {
      await setHeliosLider(equipoId, usuarioId)
      notify({ type: 'success', title: 'Líder actualizado', message: `${nombre} es ahora el líder.` })
      await load()
    } catch (err) {
      notify({ type: 'error', title: 'Error', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo actualizar el líder.') : 'Error.' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleAddMiembro(equipoId: string) {
    if (!selectedUsuario) return
    setActionLoading(`add-${equipoId}`)
    try {
      await addHeliosMiembro(equipoId, selectedUsuario)
      notify({ type: 'success', title: 'Miembro agregado', message: 'Miembro agregado al equipo.' })
      setSelectedUsuario('')
      setAddMiembroEquipoId(null)
      await load()
    } catch (err) {
      notify({ type: 'error', title: 'Error', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo agregar.') : 'Error.' })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <p className="py-8 text-center text-sm text-muted">Cargando equipos…</p>

  return (
    <div className="space-y-6">
      {/* Create team */}
      {nombresDisponibles.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#e3ecf7] bg-white p-4">
          <select
            value={selectedNombre}
            onChange={e => setSelectedNombre(e.target.value)}
            className="flex-1 rounded-xl border border-[#cdd9ec] px-3 py-2 font-display text-sm text-navy outline-none focus:border-accent"
          >
            <option value="">Seleccionar equipo a crear…</option>
            {nombresDisponibles.map(n => (
              <option key={n.id} value={n.nombre}>{n.nombre} — {n.ruta}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating || !selectedNombre}
            className="rounded-xl border border-accent px-4 py-2 font-display text-[13px] font-semibold text-accent hover:bg-accent/5 disabled:opacity-50"
          >
            {creating ? 'Creando…' : 'Crear equipo'}
          </button>
        </div>
      )}

      {equipos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No hay equipos creados aún.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#e3ecf7] bg-white">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[#f1f3f7] bg-navy">
                {['Equipo', 'Ruta', 'Miembros', 'Líder', 'Progreso', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-display text-[11px] font-semibold uppercase tracking-wider text-[#5aa9e6]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipos.map(eq => {
                const lider = eq.miembros.find(m => m.usuario_id === eq.lider_id)
                const isExpanded = expandedId === eq.id
                return (
                  <>
                    <tr key={eq.id} className="border-t border-[#f1f3f7] hover:bg-[#f8fafd]">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : eq.id)}
                          className="flex items-center gap-1.5 font-display text-sm font-bold text-navy hover:text-accent"
                        >
                          <span className="text-[10px] text-muted">{isExpanded ? '▼' : '▶'}</span>
                          {eq.nombre}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-display text-[12px] text-muted">{eq.ruta_nombre}</td>
                      <td className="px-4 py-3 font-mono text-sm text-navy">{eq.miembros.length}</td>
                      <td className="px-4 py-3 font-display text-[12px] text-navy">
                        {lider ? lider.nombre_completo : <span className="text-muted italic">Sin líder</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#e8eef8]">
                            <div
                              className="h-full rounded-full bg-accent transition-all"
                              style={{ width: `${eq.porcentaje}%` }}
                            />
                          </div>
                          <span className="font-mono text-[12px] font-semibold text-accent">{eq.porcentaje}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void handleDelete(eq.id, eq.nombre)}
                          disabled={actionLoading === eq.id}
                          className="rounded-lg border border-[#cdd9ec] px-2.5 py-1 font-display text-[11px] text-muted hover:border-red-200 hover:text-red-600 disabled:opacity-40"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${eq.id}-expanded`} className="border-t border-[#f1f3f7] bg-[#f8fafd]">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-3">
                            <p className="font-display text-[12px] font-semibold text-muted">Miembros del equipo</p>

                            {eq.miembros.length === 0 ? (
                              <p className="text-[13px] text-muted italic">Sin miembros.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {eq.miembros.map(m => (
                                  <div key={m.usuario_id} className="flex items-center gap-3 rounded-xl border border-[#e3ecf7] bg-white px-3 py-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef4fd] font-display text-xs font-bold text-accent">
                                      {m.nombre_completo.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-semibold text-navy">{m.nombre_completo}</p>
                                      <p className="truncate text-[11px] text-muted">{m.email}</p>
                                    </div>
                                    {m.usuario_id === eq.lider_id && (
                                      <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-display text-[10px] font-bold text-accent">
                                        Líder
                                      </span>
                                    )}
                                    <div className="flex gap-1.5">
                                      {m.usuario_id !== eq.lider_id && (
                                        <button
                                          type="button"
                                          onClick={() => void handleSetLider(eq.id, m.usuario_id, m.nombre_completo)}
                                          disabled={actionLoading === `lider-${eq.id}-${m.usuario_id}`}
                                          className="rounded-lg border border-[#cdd9ec] px-2 py-1 font-display text-[11px] text-muted hover:border-accent hover:text-accent disabled:opacity-40"
                                        >
                                          Hacer líder
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => void handleRemoveMiembro(eq.id, m.usuario_id, m.nombre_completo)}
                                        disabled={actionLoading === `rm-${eq.id}-${m.usuario_id}`}
                                        className="rounded-lg border border-[#cdd9ec] px-2 py-1 font-display text-[11px] text-muted hover:border-red-200 hover:text-red-600 disabled:opacity-40"
                                      >
                                        Quitar
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add member */}
                            {addMiembroEquipoId === eq.id ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={selectedUsuario}
                                  onChange={e => setSelectedUsuario(e.target.value)}
                                  className="flex-1 rounded-xl border border-[#cdd9ec] px-3 py-2 font-display text-sm text-navy outline-none focus:border-accent"
                                >
                                  <option value="">Seleccionar estudiante…</option>
                                  {disponibles.map(d => (
                                    <option key={d.id} value={d.id}>{d.nombre_completo} — {d.email}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => void handleAddMiembro(eq.id)}
                                  disabled={!selectedUsuario || actionLoading === `add-${eq.id}`}
                                  className="rounded-xl border border-accent px-3 py-2 font-display text-[13px] font-semibold text-accent hover:bg-accent/5 disabled:opacity-50"
                                >
                                  {actionLoading === `add-${eq.id}` ? 'Agregando…' : 'Agregar'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setAddMiembroEquipoId(null); setSelectedUsuario('') }}
                                  className="rounded-xl border border-[#cdd9ec] px-3 py-2 font-display text-[13px] text-muted hover:bg-[#f1f5fb]"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => { setAddMiembroEquipoId(eq.id); setSelectedUsuario('') }}
                                className="rounded-xl border border-[#cdd9ec] px-3 py-2 font-display text-[13px] font-semibold text-navy hover:bg-[#f1f5fb]"
                              >
                                + Agregar miembro
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

function HeliosGateToggle() {
  const { heliosOpen, heliosToggling, toggleHelios } = useAdmin()
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#e3ecf7] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(1,40,84,0.04)]">
      <div>
        <p className="font-display text-sm font-bold text-navy">Acceso al Escape Room</p>
        <p className="mt-0.5 text-[12px] text-muted">
          {heliosOpen ? 'El botón de Helios es visible en la landing para los estudiantes.' : 'El Escape Room está oculto en la landing.'}
        </p>
      </div>
      <Toggle checked={heliosOpen} onChange={() => void toggleHelios()} disabled={heliosToggling} />
    </div>
  )
}

export function AdminHeliosPage() {
  const { notify } = useNotification()
  const [tab, setTab] = useState<'progreso' | 'equipos'>('progreso')
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

  // Auto-refresh every 20s on progreso tab
  useEffect(() => {
    if (tab !== 'progreso') return
    const id = setInterval(() => void load(), 20_000)
    return () => clearInterval(id)
  }, [load, tab])

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

  return (
    <div className="space-y-6">
      <HeliosGateToggle />

      {/* Tab switcher */}
      <div className="flex gap-2">
        {(['progreso', 'equipos'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 font-display text-[13px] font-semibold transition-colors ${
              tab === t
                ? 'bg-navy text-white'
                : 'border border-[#cdd9ec] text-navy hover:bg-[#f1f5fb]'
            }`}
          >
            {t === 'progreso' ? 'Progreso' : 'Equipos'}
          </button>
        ))}
      </div>

      {tab === 'progreso' && (
        <>
          {loading && !data ? (
            <p className="py-8 text-center text-sm text-muted">Cargando…</p>
          ) : data ? (
            <>
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
            </>
          ) : null}
        </>
      )}

      {tab === 'equipos' && <EquiposTab />}
    </div>
  )
}
