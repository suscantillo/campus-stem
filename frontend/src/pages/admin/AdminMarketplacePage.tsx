import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, mapApiErrorToSpanish } from '../../lib/api'
import {
  createProducto,
  deleteProducto,
  listComprasAdmin,
  listPresupuestos,
  listProductosAdmin,
  revertirCompra,
  setPresupuesto,
  updateProducto,
  type CompraResponse,
  type EquipoPresupuesto,
  type ProductoCreate,
  type ProductoResponse,
} from '../../lib/adminMarketplaceApi'
import { useNotification } from '../../context/NotificationContext'

type Tab = 'productos' | 'presupuestos' | 'historial'

// ── Product modal ──────────────────────────────────────────────────────────────

function ProductoModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial?: ProductoResponse
  onSave: (data: ProductoCreate) => void
  onClose: () => void
  saving: boolean
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '')
  const [precio, setPrecio] = useState(String(initial?.precio ?? 0))
  const [stock, setStock] = useState(String(initial?.stock ?? 0))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      precio: Number(precio),
      stock: Number(stock),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e3ecf7] bg-white p-6 shadow-xl">
        <h2 className="mb-5 font-display text-lg font-bold text-navy">
          {initial ? 'Editar producto' : 'Nuevo producto'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block font-display text-[13px] font-semibold text-navy">
              Nombre
            </label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-[#cdd9ec] px-3.5 py-2.5 text-sm text-navy outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-display text-[13px] font-semibold text-navy">
              Descripción <span className="font-normal text-muted">(opcional)</span>
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-[#cdd9ec] px-3.5 py-2.5 text-sm text-navy outline-none focus:border-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-display text-[13px] font-semibold text-navy">
                Precio
              </label>
              <input
                type="number"
                min={0}
                required
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full rounded-xl border border-[#cdd9ec] px-3.5 py-2.5 text-sm text-navy outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-display text-[13px] font-semibold text-navy">
                Stock
              </label>
              <input
                type="number"
                min={0}
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-xl border border-[#cdd9ec] px-3.5 py-2.5 text-sm text-navy outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-[#cdd9ec] py-2.5 font-display text-sm font-semibold text-[#3a4868] disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="accent-gradient flex-1 rounded-xl py-2.5 font-display text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Productos tab ──────────────────────────────────────────────────────────────

function TabProductos() {
  const { notify } = useNotification()
  const [productos, setProductos] = useState<ProductoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductoResponse | undefined>()
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<ProductoResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listProductosAdmin()
      setProductos(data.items)
    } catch (err) {
      setError(err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo cargar.') : 'Error de conexión.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleSave(data: ProductoCreate) {
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateProducto(editing.id, data)
        setProductos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        notify({ type: 'success', title: 'Producto actualizado', message: updated.nombre })
      } else {
        const created = await createProducto(data)
        setProductos((prev) => [...prev, created])
        notify({ type: 'success', title: 'Producto creado', message: created.nombre })
      }
      setModalOpen(false)
      setEditing(undefined)
    } catch (err) {
      notify({ type: 'error', title: 'Error', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo guardar.') : 'Error de conexión.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteProducto(toDelete.id)
      setProductos((prev) => prev.filter((p) => p.id !== toDelete.id))
      notify({ type: 'success', title: 'Producto eliminado', message: toDelete.nombre })
      setToDelete(null)
    } catch (err) {
      notify({ type: 'error', title: 'Error', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo eliminar.') : 'Error de conexión.' })
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {(modalOpen || editing) && (
        <ProductoModal
          initial={editing}
          onSave={(d) => void handleSave(d)}
          onClose={() => { setModalOpen(false); setEditing(undefined) }}
          saving={saving}
        />
      )}

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#e3ecf7] bg-white p-6 shadow-xl">
            <h2 className="mb-2 font-display text-lg font-bold text-navy">Eliminar producto</h2>
            <p className="mb-6 text-sm text-muted">
              ¿Eliminar <span className="font-semibold text-navy">{toDelete.nombre}</span>? Las compras previas se conservan.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setToDelete(null)} disabled={deleting} className="flex-1 rounded-xl border border-[#cdd9ec] py-2.5 font-display text-sm font-semibold text-[#3a4868] disabled:opacity-60">Cancelar</button>
              <button type="button" onClick={() => void handleDelete()} disabled={deleting} className="flex-1 rounded-xl bg-red-600 py-2.5 font-display text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">{deleting ? 'Eliminando…' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[12px] text-muted">{productos.length} productos</p>
        <button
          type="button"
          onClick={() => { setEditing(undefined); setModalOpen(true) }}
          className="accent-gradient flex h-9 items-center rounded-xl px-4 font-display text-sm font-bold text-white shadow-[0_10px_24px_-14px_rgba(47,107,224,0.8)]"
        >
          + Nuevo producto
        </button>
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-[#e3ecf7] bg-white">
        <div className="grid grid-cols-[2fr_2.5fr_1fr_1fr_5rem] bg-navy px-4 py-3.5">
          {['Nombre', 'Descripción', 'Precio', 'Stock', ''].map((col) => (
            <span key={col} className="font-display text-[13px] font-semibold text-[#5aa9e6]">{col}</span>
          ))}
        </div>
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-muted">Cargando…</p>
        ) : productos.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">No hay productos. Crea el primero.</p>
        ) : (
          productos.map((p) => (
            <div key={p.id} className="grid grid-cols-[2fr_2.5fr_1fr_1fr_5rem] items-center border-t border-[#f1f3f7] px-4 py-3.5">
              <span className="text-sm font-semibold text-navy">{p.nombre}</span>
              <span className="truncate text-sm text-muted">{p.descripcion ?? '—'}</span>
              <span className="font-mono text-sm text-navy">{p.precio.toLocaleString()}</span>
              <span className={`font-mono text-sm ${p.stock === 0 ? 'text-red-500' : 'text-navy'}`}>{p.stock}</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => { setEditing(p); setModalOpen(false) }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9aa3b8] hover:bg-blue-50 hover:text-accent"
                  title="Editar"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(p)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9aa3b8] hover:bg-red-50 hover:text-red-600"
                  title="Eliminar"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

// ── Presupuestos tab ───────────────────────────────────────────────────────────

function TabPresupuestos() {
  const { notify } = useNotification()
  const [equipos, setEquipos] = useState<EquipoPresupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listPresupuestos()
      setEquipos(data.items)
    } catch (err) {
      setError(err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo cargar.') : 'Error de conexión.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleSavePresupuesto(equipoId: string) {
    const value = editing[equipoId]
    const num = Number(value)
    if (isNaN(num) || num < 0) return
    setSaving((s) => ({ ...s, [equipoId]: true }))
    try {
      const updated = await setPresupuesto(equipoId, num)
      setEquipos((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
      setEditing((e) => { const n = { ...e }; delete n[equipoId]; return n })
      notify({ type: 'success', title: 'Presupuesto actualizado', message: updated.nombre })
    } catch (err) {
      notify({ type: 'error', title: 'Error', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo guardar.') : 'Error de conexión.' })
    } finally {
      setSaving((s) => ({ ...s, [equipoId]: false }))
    }
  }

  return (
    <>
      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="overflow-hidden rounded-2xl border border-[#e3ecf7] bg-white">
        <div className="grid grid-cols-[3fr_2fr_6rem] bg-navy px-4 py-3.5">
          {['Equipo', 'Presupuesto actual', ''].map((col) => (
            <span key={col} className="font-display text-[13px] font-semibold text-[#5aa9e6]">{col}</span>
          ))}
        </div>
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-muted">Cargando…</p>
        ) : equipos.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">No hay equipos.</p>
        ) : (
          equipos.map((e) => {
            const isEditing = editing[e.id] !== undefined
            const isSaving = saving[e.id] ?? false
            return (
              <div key={e.id} className="grid grid-cols-[3fr_2fr_6rem] items-center border-t border-[#f1f3f7] px-4 py-3">
                <span className="text-sm font-semibold text-navy">{e.nombre}</span>
                {isEditing ? (
                  <input
                    type="number"
                    min={0}
                    value={editing[e.id]}
                    onChange={(ev) => setEditing((ed) => ({ ...ed, [e.id]: ev.target.value }))}
                    className="w-28 rounded-lg border border-[#cdd9ec] px-2 py-1 font-mono text-sm text-navy outline-none focus:border-accent"
                  />
                ) : (
                  <span className="font-mono text-sm text-navy">{e.presupuesto.toLocaleString()}</span>
                )}
                <div className="flex gap-1.5">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleSavePresupuesto(e.id)}
                        disabled={isSaving}
                        className="rounded-lg bg-accent px-2.5 py-1 font-display text-xs font-bold text-white disabled:opacity-60"
                      >
                        {isSaving ? '…' : 'OK'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing((ed) => { const n = { ...ed }; delete n[e.id]; return n })}
                        className="rounded-lg border border-[#cdd9ec] px-2.5 py-1 font-display text-xs font-semibold text-[#3a4868]"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditing((ed) => ({ ...ed, [e.id]: String(e.presupuesto) }))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9aa3b8] hover:bg-blue-50 hover:text-accent"
                      title="Editar presupuesto"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}

// ── Reversion modal ────────────────────────────────────────────────────────────

function ReversionModal({
  compra,
  onConfirm,
  onCancel,
  loading,
}: {
  compra: CompraResponse
  onConfirm: (cantidad: number) => void
  onCancel: () => void
  loading: boolean
}) {
  const maxRevertible = compra.cantidad_disponible
  const [cantidad, setCantidad] = useState(maxRevertible)
  const total = cantidad * compra.precio_unitario

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#e3ecf7] bg-white p-6 shadow-xl">
        <h2 className="mb-1 font-display text-lg font-bold text-navy">Revertir compra</h2>
        <p className="mb-4 text-sm text-muted">
          <span className="font-semibold text-navy">{compra.equipo_nombre}</span>
          {' — '}
          {compra.producto_nombre}
        </p>

        <div className="mb-4 space-y-1.5 rounded-xl bg-[#f6f9ff] p-3.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Compra original</span>
            <span className="font-mono font-semibold text-navy">{compra.cantidad} uds.</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Ya revertidas</span>
            <span className="font-mono text-muted">{compra.cantidad_revertida} uds.</span>
          </div>
          <div className="flex justify-between border-t border-[#e3ecf7] pt-1.5">
            <span className="text-muted">Disponibles</span>
            <span className="font-mono font-bold text-navy">{maxRevertible} uds.</span>
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block font-display text-[13px] font-semibold text-navy">
            Cantidad a revertir (máx. {maxRevertible})
          </label>
          <input
            type="number"
            min={1}
            max={maxRevertible}
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, Math.min(maxRevertible, Number(e.target.value))))}
            className="w-full rounded-xl border border-[#cdd9ec] px-3.5 py-2.5 font-mono text-sm text-navy outline-none focus:border-accent"
          />
          <p className="mt-1.5 font-mono text-[12px] text-muted">
            Presupuesto a devolver: <span className="font-bold text-navy">{total.toLocaleString()}</span>
          </p>
        </div>

        {compra.reversiones.length > 0 && (
          <details className="mb-4">
            <summary className="cursor-pointer font-display text-[12px] font-semibold text-muted hover:text-navy">
              Ver reversiones anteriores ({compra.reversiones.length})
            </summary>
            <div className="mt-2 space-y-1">
              {compra.reversiones.map((r) => (
                <div key={r.id} className="flex justify-between rounded-lg bg-[#f6f9ff] px-3 py-2 text-[12px]">
                  <span className="text-muted">{r.admin_nombre ?? 'Admin'} — {r.cantidad} uds.</span>
                  <span className="font-mono text-muted">{new Date(r.created_at).toLocaleDateString('es-CO')}</span>
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={loading} className="flex-1 rounded-xl border border-[#cdd9ec] py-2.5 font-display text-sm font-semibold text-[#3a4868] disabled:opacity-60">Cancelar</button>
          <button type="button" onClick={() => onConfirm(cantidad)} disabled={loading || cantidad < 1} className="flex-1 rounded-xl bg-amber-500 py-2.5 font-display text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60">{loading ? 'Revirtiendo…' : 'Revertir'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Historial tab ──────────────────────────────────────────────────────────────

function TabHistorial() {
  const { notify } = useNotification()
  const [compras, setCompras] = useState<CompraResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [toRevertir, setToRevertir] = useState<CompraResponse | null>(null)
  const [reverting, setReverting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listComprasAdmin()
      setCompras(data.items)
    } catch (err) {
      setError(err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo cargar.') : 'Error de conexión.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return compras
    return compras.filter(
      (c) =>
        (c.equipo_nombre?.toLowerCase().includes(q) ?? false) ||
        (c.producto_nombre?.toLowerCase().includes(q) ?? false),
    )
  }, [query, compras])

  async function handleRevertir(cantidad: number) {
    if (!toRevertir) return
    setReverting(true)
    try {
      const updated = await revertirCompra(toRevertir.id, cantidad)
      setCompras((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      notify({
        type: 'success',
        title: 'Compra revertida',
        message: `${cantidad} uds. devueltas a ${updated.equipo_nombre ?? 'equipo'}.`,
      })
      setToRevertir(null)
    } catch (err) {
      notify({
        type: 'error',
        title: 'No se pudo revertir',
        message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'Error al revertir.') : 'Error de conexión.',
      })
      setToRevertir(null)
    } finally {
      setReverting(false)
    }
  }

  return (
    <>
      {toRevertir && (
        <ReversionModal
          compra={toRevertir}
          onConfirm={(c) => void handleRevertir(c)}
          onCancel={() => setToRevertir(null)}
          loading={reverting}
        />
      )}

      <div className="mb-4 flex items-center gap-3">
        <label className="flex h-10 min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-[#cdd9ec] bg-white px-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa3b8" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>
          <input
            type="search"
            placeholder="Filtrar por equipo o producto…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm text-navy outline-none placeholder:text-[#9aa3b8]"
          />
        </label>
        <button type="button" onClick={() => void load()} disabled={loading} className="flex h-10 items-center rounded-xl border border-[#cdd9ec] bg-white px-3.5 font-display text-sm font-semibold text-[#3a4868] disabled:opacity-60">{loading ? 'Actualizando…' : 'Actualizar'}</button>
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-[#e3ecf7] bg-white">
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1.4fr_2.5rem] bg-navy px-4 py-3.5">
          {['Equipo', 'Producto', 'Cant.', 'Precio u.', 'Total', 'Estado', ''].map((col) => (
            <span key={col} className="font-display text-[13px] font-semibold text-[#5aa9e6]">{col}</span>
          ))}
        </div>
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-muted">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">{compras.length === 0 ? 'Aún no hay compras.' : 'Sin resultados.'}</p>
        ) : (
          filtered.map((c) => {
            const totalmenteRevertida = c.cantidad_disponible === 0
            return (
              <div key={c.id} className={`grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1.4fr_2.5rem] items-center border-t border-[#f1f3f7] px-4 py-3 ${totalmenteRevertida ? 'opacity-50' : ''}`}>
                <span className="text-sm font-semibold text-navy">{c.equipo_nombre ?? '—'}</span>
                <span className="text-sm text-muted">{c.producto_nombre ?? '—'}</span>
                <span className="font-mono text-sm text-muted">{c.cantidad}</span>
                <span className="font-mono text-sm text-muted">{c.precio_unitario.toLocaleString()}</span>
                <span className="font-mono text-sm font-semibold text-navy">{c.total.toLocaleString()}</span>
                <span className={`font-mono text-[11px] ${totalmenteRevertida ? 'text-red-500' : c.cantidad_revertida > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {totalmenteRevertida
                    ? 'Revertida'
                    : c.cantidad_revertida > 0
                      ? `Parcial (${c.cantidad_disponible} disp.)`
                      : 'Activa'}
                </span>
                <button
                  type="button"
                  onClick={() => setToRevertir(c)}
                  disabled={totalmenteRevertida}
                  title="Revertir compra"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9aa3b8] hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
              </div>
            )
          })
        )}
      </div>

      {!loading && compras.length > 0 && (
        <p className="mt-3 font-mono text-[11px] text-muted">{filtered.length} de {compras.length} compras</p>
      )}
    </>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function AdminMarketplacePage() {
  const [tab, setTab] = useState<Tab>('productos')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'productos', label: 'Productos' },
    { id: 'presupuestos', label: 'Presupuestos' },
    { id: 'historial', label: 'Historial de compras' },
  ]

  return (
    <>
      <div className="mb-6 flex gap-1 rounded-xl border border-[#e3ecf7] bg-white p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 font-display text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'accent-gradient text-white shadow-sm'
                : 'text-[#3a4868] hover:text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'productos' && <TabProductos />}
      {tab === 'presupuestos' && <TabPresupuestos />}
      {tab === 'historial' && <TabHistorial />}
    </>
  )
}
