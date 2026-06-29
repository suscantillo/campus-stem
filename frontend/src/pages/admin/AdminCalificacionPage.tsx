import { useCallback, useEffect, useState } from 'react'
import { useNotification } from '../../context/NotificationContext'
import { ApiError, mapApiErrorToSpanish } from '../../lib/api'
import {
  createCriterio,
  deleteCriterio,
  getCalificacionStatus,
  getExportUrl,
  getMatriz,
  getResultados,
  listCriterios,
  resetAsignaciones,
  toggleAsignacion,
  toggleCalificacion,
  updateCriterio,
  type CalificacionStatusResponse,
  type CriterioResponse,
  type MatrizAsignacionesResponse,
  type ResultadosResponse,
} from '../../lib/adminCalificacionApi'
import { useAuth } from '../../context/AuthContext'

type Tab = 'rubrica' | 'asignaciones' | 'gate' | 'resultados'

// ── Badge de estado ────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    Completo: 'bg-green-50 border-green-200 text-green-700',
    Parcial: 'bg-amber-50 border-amber-200 text-amber-700',
    'Sin calificar': 'bg-[#f1f3f7] border-[#e3ecf7] text-muted',
  }
  return (
    <span className={`rounded-full border px-2.5 py-0.5 font-display text-[11px] font-semibold ${styles[estado] ?? styles['Sin calificar']}`}>
      {estado}
    </span>
  )
}

// ── Tab: Rúbrica ───────────────────────────────────────────────────────────────

function RubricaTab({ locked }: { locked: boolean }) {
  const { notify } = useNotification()
  const [criterios, setCriterios] = useState<CriterioResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [puntaje, setPuntaje] = useState('')
  const [desc, setDesc] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editPuntaje, setEditPuntaje] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setCriterios(await listCriterios()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !puntaje) return
    setAdding(true)
    try {
      const c = await createCriterio({ nombre: nombre.trim(), descripcion: desc || null, puntaje_maximo: Number(puntaje), orden: criterios.length })
      setCriterios(prev => [...prev, c])
      setNombre(''); setPuntaje(''); setDesc('')
      notify({ type: 'success', title: 'Criterio añadido' })
    } catch (err) {
      notify({ type: 'error', title: 'Error', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail) : 'Error al añadir.' })
    } finally { setAdding(false) }
  }

  async function handleSaveEdit(id: string) {
    try {
      const updated = await updateCriterio(id, { nombre: editNombre.trim(), puntaje_maximo: Number(editPuntaje) })
      setCriterios(prev => prev.map(c => c.id === id ? updated : c))
      setEditId(null)
    } catch (err) {
      notify({ type: 'error', title: 'Error', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail) : 'Error al guardar.' })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCriterio(id)
      setCriterios(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      notify({ type: 'error', title: 'No se pudo eliminar', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail) : 'Error.' })
    }
  }

  async function handleMove(idx: number, dir: -1 | 1) {
    const newList = [...criterios]
    const target = idx + dir
    if (target < 0 || target >= newList.length) return
    ;[newList[idx], newList[target]] = [newList[target], newList[idx]]
    setCriterios(newList)
    try {
      const updated = await import('../../lib/adminCalificacionApi').then(m => m.reorderCriterios(newList.map(c => c.id)))
      setCriterios(updated)
    } catch { void load() }
  }

  if (loading) return <p className="py-8 text-center text-sm text-muted">Cargando…</p>

  return (
    <div className="space-y-5">
      {locked && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-700">La calificación está abierta — ciérrala para editar la rúbrica.</p>
        </div>
      )}

      {criterios.length === 0 ? (
        <p className="text-sm text-muted">Aún no hay criterios. Añade el primero abajo.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#e3ecf7] bg-white">
          <div className="grid grid-cols-[1.5rem_1fr_6rem_6rem_5rem] gap-x-4 bg-navy px-4 py-3">
            {['', 'Criterio', 'Pts. máx.', '', ''].map((h, i) => (
              <span key={i} className="font-display text-[12px] font-semibold text-[#5aa9e6]">{h}</span>
            ))}
          </div>
          {criterios.map((c, i) => (
            <div key={c.id} className="grid grid-cols-[1.5rem_1fr_6rem_6rem_5rem] items-center gap-x-4 border-t border-[#f1f3f7] px-4 py-2.5">
              {/* orden */}
              <div className="flex flex-col gap-0.5">
                <button type="button" disabled={locked || i === 0} onClick={() => void handleMove(i, -1)}
                  className="text-muted disabled:opacity-30 hover:text-navy">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 15l-6-6-6 6" /></svg>
                </button>
                <button type="button" disabled={locked || i === criterios.length - 1} onClick={() => void handleMove(i, 1)}
                  className="text-muted disabled:opacity-30 hover:text-navy">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                </button>
              </div>
              {/* nombre */}
              {editId === c.id ? (
                <input value={editNombre} onChange={e => setEditNombre(e.target.value)}
                  className="rounded-lg border border-[#cdd9ec] px-2.5 py-1.5 text-sm text-navy outline-none focus:border-accent" />
              ) : (
                <div>
                  <p className="text-sm font-semibold text-navy">{c.nombre}</p>
                  {c.descripcion && <p className="text-xs text-muted">{c.descripcion}</p>}
                </div>
              )}
              {/* puntaje */}
              {editId === c.id ? (
                <input type="number" min={1} value={editPuntaje} onChange={e => setEditPuntaje(e.target.value)}
                  className="rounded-lg border border-[#cdd9ec] px-2.5 py-1.5 text-sm text-navy outline-none focus:border-accent" />
              ) : (
                <span className="font-mono text-sm font-semibold text-navy">{c.puntaje_maximo}</span>
              )}
              {/* acciones editar */}
              <div className="flex gap-2">
                {!locked && editId === c.id ? (
                  <>
                    <button type="button" onClick={() => void handleSaveEdit(c.id)}
                      className="rounded-lg bg-accent px-2.5 py-1 font-display text-[11px] font-bold text-white">Guardar</button>
                    <button type="button" onClick={() => setEditId(null)}
                      className="rounded-lg border border-[#cdd9ec] px-2 py-1 font-display text-[11px] text-navy">✕</button>
                  </>
                ) : !locked ? (
                  <button type="button" onClick={() => { setEditId(c.id); setEditNombre(c.nombre); setEditPuntaje(String(c.puntaje_maximo)) }}
                    className="rounded-lg border border-[#cdd9ec] px-2.5 py-1 font-display text-[11px] font-semibold text-navy hover:bg-[#f1f5fb]">Editar</button>
                ) : null}
              </div>
              {/* eliminar */}
              {!locked && (
                <button type="button" onClick={() => void handleDelete(c.id)}
                  className="flex items-center justify-center rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!locked && (
        <form onSubmit={e => void handleAdd(e)} className="rounded-2xl border border-[#e3ecf7] bg-white p-5">
          <p className="mb-4 font-display text-[13px] font-semibold text-navy">Añadir criterio</p>
          <div className="flex flex-wrap gap-3">
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del criterio"
              className="flex-1 min-w-[160px] rounded-xl border border-[#cdd9ec] px-3.5 py-2.5 text-sm text-navy outline-none focus:border-accent" required />
            <input type="number" min={1} value={puntaje} onChange={e => setPuntaje(e.target.value)} placeholder="Pts. máx."
              className="w-24 rounded-xl border border-[#cdd9ec] px-3.5 py-2.5 text-sm text-navy outline-none focus:border-accent" required />
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción (opcional)"
              className="flex-1 min-w-[160px] rounded-xl border border-[#cdd9ec] px-3.5 py-2.5 text-sm text-navy outline-none focus:border-accent" />
            <button type="submit" disabled={adding}
              className="accent-gradient rounded-xl px-5 py-2.5 font-display text-sm font-bold text-white disabled:opacity-60">
              {adding ? 'Añadiendo…' : 'Añadir'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Tab: Asignaciones ──────────────────────────────────────────────────────────

function AsignacionesTab() {
  const { notify } = useNotification()
  const [matriz, setMatriz] = useState<MatrizAsignacionesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setMatriz(await getMatriz()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleToggle(juez_id: string, equipo_id: string) {
    const key = `${juez_id}:${equipo_id}`
    setToggling(key)
    try { setMatriz(await toggleAsignacion(juez_id, equipo_id)) }
    catch (err) { notify({ type: 'error', title: 'Error', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail) : 'Error.' }) }
    finally { setToggling(null) }
  }

  async function handleReset() {
    setResetting(true)
    try { setMatriz(await resetAsignaciones()); notify({ type: 'success', title: 'Asignaciones restablecidas' }) }
    catch { notify({ type: 'error', title: 'Error al restablecer' }) }
    finally { setResetting(false) }
  }

  if (loading) return <p className="py-8 text-center text-sm text-muted">Cargando…</p>
  if (!matriz) return null

  if (matriz.jueces.length === 0) return <p className="text-sm text-muted">No hay jueces registrados aún.</p>
  if (matriz.equipos.length === 0) return <p className="text-sm text-muted">No hay equipos creados aún.</p>

  const asignadoSet = new Set(matriz.asignados)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">{matriz.jueces.length} juez(ces) × {matriz.equipos.length} equipos</p>
        <button type="button" onClick={() => void handleReset()} disabled={resetting}
          className="rounded-xl border border-[#cdd9ec] px-4 py-2 font-display text-[13px] font-semibold text-navy hover:bg-[#f1f5fb] disabled:opacity-60">
          {resetting ? 'Restableciendo…' : 'Todos × todos'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#e3ecf7] bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="bg-navy">
              <th className="px-4 py-3 text-left font-display text-[12px] font-semibold text-[#5aa9e6]">Juez</th>
              {matriz.equipos.map(e => (
                <th key={e.id} className="px-3 py-3 text-center font-display text-[11px] font-semibold text-[#5aa9e6] max-w-[100px]">
                  <span className="block truncate max-w-[90px]">{e.nombre}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matriz.jueces.map(j => (
              <tr key={j.id} className="border-t border-[#f1f3f7]">
                <td className="px-4 py-2.5 text-sm font-semibold text-navy whitespace-nowrap">{j.nombre_completo}</td>
                {matriz.equipos.map(e => {
                  const key = `${j.id}:${e.id}`
                  const asignado = asignadoSet.has(key)
                  const busy = toggling === key
                  return (
                    <td key={e.id} className="px-3 py-2.5 text-center">
                      <button type="button" onClick={() => void handleToggle(j.id, e.id)} disabled={busy}
                        className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                          asignado
                            ? 'border-accent bg-accent/10 text-accent hover:bg-red-50 hover:border-red-300 hover:text-red-500'
                            : 'border-[#cdd9ec] text-muted hover:border-accent hover:bg-accent/8 hover:text-accent'
                        } disabled:opacity-50`}
                        title={asignado ? 'Quitar asignación' : 'Asignar'}>
                        {busy ? (
                          <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" /></svg>
                        ) : asignado ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        )}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab: Gate calificación ─────────────────────────────────────────────────────

function GateTab({
  status,
  onToggle,
  toggling,
}: {
  status: CalificacionStatusResponse
  onToggle: (v: boolean) => Promise<void>
  toggling: boolean
}) {
  const pct = status.calificaciones_esperadas > 0
    ? Math.round((status.calificaciones_enviadas / status.calificaciones_esperadas) * 100)
    : 0

  return (
    <div className="space-y-5">
      {/* Toggle principal */}
      <div className="rounded-2xl border border-[#e3ecf7] bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-base font-bold text-navy">Fase de calificación</p>
            <p className="mt-0.5 text-sm text-muted">
              {status.calificacion_abierta
                ? 'Los jueces pueden enviar sus calificaciones ahora.'
                : 'Los jueces no pueden calificar. Abre para habilitarlos.'}
            </p>
          </div>
          <button
            type="button"
            disabled={toggling}
            onClick={() => void onToggle(!status.calificacion_abierta)}
            className={`relative h-8 w-14 rounded-full transition-colors disabled:opacity-60 ${
              status.calificacion_abierta ? 'bg-accent' : 'bg-[#cdd9ec]'
            }`}
          >
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
              status.calificacion_abierta ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Jueces', value: status.total_jueces },
          { label: 'Equipos', value: status.total_equipos },
          { label: 'Enviadas', value: status.calificaciones_enviadas },
          { label: 'Esperadas', value: status.calificaciones_esperadas },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-[#e3ecf7] bg-white p-4 text-center">
            <p className="font-mono text-2xl font-bold text-accent">{s.value}</p>
            <p className="mt-1 font-display text-[13px] font-semibold text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Barra de progreso */}
      {status.calificaciones_esperadas > 0 && (
        <div className="rounded-2xl border border-[#e3ecf7] bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-sm font-semibold text-navy">Progreso</p>
            <p className="font-mono text-sm font-bold text-accent">{pct}%</p>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e8eef8]">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">
            {status.calificaciones_enviadas} de {status.calificaciones_esperadas} calificaciones enviadas
          </p>
        </div>
      )}
    </div>
  )
}

// ── Tab: Resultados ────────────────────────────────────────────────────────────

function ResultadosTab() {
  const { user } = useAuth()
  const [data, setData] = useState<ResultadosResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setData(await getResultados()) }
    catch { setError('No se pudo cargar los resultados.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  // Build export URL with auth token
  function handleExport() {
    // Open the export in a new tab — the backend will require auth header.
    // Since we can't set headers on <a href>, we fetch as blob and download.
    const url = getExportUrl()
    const token = localStorage.getItem('access_token')
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'resultados-campus-stem.xlsx'
        a.click()
      })
  }

  if (loading) return <p className="py-8 text-center text-sm text-muted">Cargando resultados…</p>
  if (error) return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
  if (!data) return null

  if (data.resultados.length === 0) return (
    <p className="text-sm text-muted">Aún no hay equipos ni calificaciones.</p>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {data.resultados.filter(r => r.estado === 'Completo').length} de {data.resultados.length} equipos completos
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load()}
            className="rounded-xl border border-[#cdd9ec] px-4 py-2 font-display text-[13px] font-semibold text-navy hover:bg-[#f1f5fb]">
            Actualizar
          </button>
          <button type="button" onClick={handleExport}
            className="accent-gradient flex items-center gap-2 rounded-xl px-4 py-2 font-display text-[13px] font-bold text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Descargar Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#e3ecf7] bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="bg-navy">
              {['Pos.', 'Equipo', 'Promedio', 'Estado', ...data.jueces.map(j => j.nombre_completo.split(' ')[0])].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-display text-[12px] font-semibold text-[#5aa9e6] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.resultados.map(r => {
              const notasByJuez = Object.fromEntries(r.notas.map(n => [n.juez_id, n.total]))
              return (
                <tr key={r.equipo_id} className="border-t border-[#f1f3f7] hover:bg-[#f8fafd]">
                  <td className="px-4 py-3 font-mono text-sm font-bold text-navy">{r.posicion}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-navy whitespace-nowrap">{r.equipo_nombre}</td>
                  <td className="px-4 py-3 font-mono text-sm font-bold text-accent">
                    {r.promedio !== null ? r.promedio.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3"><EstadoBadge estado={r.estado} /></td>
                  {data.jueces.map(j => {
                    const nota = notasByJuez[j.id]
                    return (
                      <td key={j.id} className="px-4 py-3 font-mono text-sm text-muted text-center">
                        {nota !== undefined && nota !== null ? nota : '—'}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────

export function AdminCalificacionPage() {
  const { notify } = useNotification()
  const [tab, setTab] = useState<Tab>('rubrica')
  const [status, setStatus] = useState<CalificacionStatusResponse | null>(null)
  const [toggling, setToggling] = useState(false)

  const loadStatus = useCallback(async () => {
    try { setStatus(await getCalificacionStatus()) } catch { /* ignore */ }
  }, [])

  useEffect(() => { void loadStatus() }, [loadStatus])

  async function handleToggle(v: boolean) {
    setToggling(true)
    try {
      const updated = await toggleCalificacion(v)
      setStatus(updated)
      notify({ type: 'success', title: v ? 'Calificación abierta' : 'Calificación cerrada' })
    } catch (err) {
      notify({
        type: 'error',
        title: 'No se pudo cambiar el estado',
        message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'Error al cambiar el estado.') : 'Error.',
      })
    } finally { setToggling(false) }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'rubrica', label: 'Rúbrica' },
    { id: 'asignaciones', label: 'Asignaciones' },
    { id: 'gate', label: 'Calificación' },
    { id: 'resultados', label: 'Resultados' },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy">Calificación</h1>
          {status && (
            <p className="mt-0.5 text-sm text-muted">
              {status.calificacion_abierta
                ? <span className="font-semibold text-green-600">● Abierta</span>
                : <span className="font-semibold text-[#9aa3b8]">● Cerrada</span>}
              {' · '}
              {status.calificaciones_enviadas}/{status.calificaciones_esperadas} enviadas
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-[#e3ecf7] bg-white p-1.5">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-xl py-2 font-display text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'bg-navy text-white shadow-sm'
                : 'text-muted hover:text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {tab === 'rubrica' && <RubricaTab locked={status?.calificacion_abierta ?? false} />}
        {tab === 'asignaciones' && <AsignacionesTab />}
        {tab === 'gate' && status && (
          <GateTab status={status} onToggle={handleToggle} toggling={toggling} />
        )}
        {tab === 'resultados' && <ResultadosTab />}
      </div>
    </div>
  )
}
