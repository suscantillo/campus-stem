import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogoLink } from '../components/Logo'
import { UserAvatar } from '../components/UserAvatar'
import { ApiError, mapApiErrorToSpanish } from '../lib/api'
import {
  comprar,
  getMarketplaceStatus,
  getMiEquipo,
  getProductos,
  type CompraResponse,
  type MiEquipoResponse,
  type Producto,
} from '../lib/marketplaceApi'
import { getMiEquipoStudent } from '../lib/studentTeamApi'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'

function CompraModal({
  producto,
  presupuesto,
  onConfirm,
  onCancel,
  loading,
}: {
  producto: Producto
  presupuesto: number
  onConfirm: (cantidad: number) => void
  onCancel: () => void
  loading: boolean
}) {
  const [cantidad, setCantidad] = useState(1)
  const total = cantidad * producto.precio
  const canAfford = presupuesto >= total
  const hasStock = producto.stock >= cantidad

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#e3ecf7] bg-white p-6 shadow-xl">
        <h2 className="mb-1 font-display text-lg font-bold text-navy">Confirmar compra</h2>
        <p className="mb-4 text-sm text-muted">{producto.nombre}</p>

        <div className="mb-4">
          <label className="mb-1.5 block font-display text-[13px] font-semibold text-navy">
            Cantidad (max. {producto.stock})
          </label>
          <input
            type="number"
            min={1}
            max={producto.stock}
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, Math.min(producto.stock, Number(e.target.value))))}
            className="w-full rounded-xl border border-[#cdd9ec] px-3.5 py-2.5 text-sm text-navy outline-none focus:border-accent"
          />
        </div>

        <div className="mb-5 space-y-1.5 rounded-xl bg-[#f6f9ff] p-3.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Precio unitario</span>
            <span className="font-mono font-semibold text-navy">{producto.precio.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Total</span>
            <span className={`font-mono font-bold ${canAfford ? 'text-navy' : 'text-red-600'}`}>{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Presupuesto restante</span>
            <span className="font-mono text-navy">{(presupuesto - total).toLocaleString()}</span>
          </div>
        </div>

        {!canAfford && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Presupuesto insuficiente para esta compra.
          </p>
        )}
        {!hasStock && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            No hay suficiente stock.
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-[#cdd9ec] py-2.5 font-display text-sm font-semibold text-[#3a4868] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(cantidad)}
            disabled={loading || !canAfford || !hasStock}
            className="accent-gradient flex-1 rounded-xl py-2.5 font-display text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Comprando…' : 'Comprar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function MarketplacePage() {
  const { notify } = useNotification()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [marketplaceOpen, setMarketplaceOpen] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true)
  const [productos, setProductos] = useState<Producto[]>([])
  const [miEquipo, setMiEquipo] = useState<MiEquipoResponse | null>(null)
  const [esLider, setEsLider] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toComprar, setToComprar] = useState<Producto | null>(null)
  const [buying, setBuying] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const s = await getMarketplaceStatus()
      setMarketplaceOpen(s.marketplace_abierto)
    } finally {
      setStatusLoading(false)
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Verificar nombre_confirmado antes de cargar
      const teamInfo = await getMiEquipoStudent()
      if (!teamInfo.nombre_confirmado) {
        navigate('/mi-equipo', { replace: true })
        return
      }
      setEsLider(teamInfo.es_lider)

      const [prods, equipo] = await Promise.all([getProductos(), getMiEquipo()])
      setProductos(prods.items)
      setMiEquipo(equipo)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Sin equipo: redirigir
        navigate('/mi-equipo', { replace: true })
        return
      }
      if (err instanceof ApiError) {
        setError(mapApiErrorToSpanish(err.detail, 'No se pudo cargar el marketplace.'))
      } else {
        setError('No se pudo conectar con el servidor.')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadStatus()
    void loadData()
  }, [loadStatus, loadData])

  async function handleComprar(cantidad: number) {
    if (!toComprar) return
    setBuying(true)
    try {
      const compra: CompraResponse = await comprar(toComprar.id, cantidad)
      setMiEquipo((prev) =>
        prev
          ? {
              ...prev,
              presupuesto: prev.presupuesto - compra.total,
              compras: [compra, ...prev.compras],
            }
          : prev,
      )
      setProductos((prev) =>
        prev.map((p) =>
          p.id === toComprar.id ? { ...p, stock: p.stock - cantidad } : p,
        ),
      )
      notify({
        type: 'success',
        title: '¡Compra realizada!',
        message: `${toComprar.nombre} × ${cantidad} — total: ${compra.total.toLocaleString()}`,
      })
      setToComprar(null)
    } catch (err) {
      notify({
        type: 'error',
        title: 'No se pudo completar la compra',
        message:
          err instanceof ApiError
            ? mapApiErrorToSpanish(err.detail, 'Error al procesar la compra.')
            : 'Error de conexión.',
      })
      setToComprar(null)
    } finally {
      setBuying(false)
    }
  }

  if (statusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-muted">Cargando…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {toComprar && miEquipo && (
        <CompraModal
          producto={toComprar}
          presupuesto={miEquipo.presupuesto}
          onConfirm={(c) => void handleComprar(c)}
          onCancel={() => setToComprar(null)}
          loading={buying}
        />
      )}

      <header className="sticky top-0 z-10 border-b border-[#e7eaf1] bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Nav row */}
          <div className="flex items-center gap-2 py-3 sm:gap-3">
            <LogoLink height={28} variant="icon" />
            <h1 className="font-display text-lg font-bold tracking-[-0.3px] text-navy sm:text-xl">
              Marketplace
            </h1>
            {esLider && (
              <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 font-display text-xs font-bold text-accent">
                Líder
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {/* Presupuesto — solo visible en sm+ aquí, en móvil va en banda propia */}
              {miEquipo && (
                <div className="hidden items-center gap-2 rounded-xl border border-[#cdd9ec] bg-white px-3.5 py-2 sm:flex">
                  <span className="font-display text-[13px] font-semibold text-muted">Presupuesto</span>
                  <span className="font-mono text-base font-bold text-navy">{miEquipo.presupuesto.toLocaleString()}</span>
                </div>
              )}
              <Link to="/mi-equipo" className="rounded-xl border border-[#cdd9ec] px-3 py-2 font-display text-[13px] font-semibold text-navy hover:bg-[#f1f5fb]">
                Mi Equipo
              </Link>
              {user && <UserAvatar name={user.nombre_completo} />}
            </div>
          </div>
          {/* Presupuesto móvil */}
          {miEquipo && (
            <div className="flex items-center border-t border-[#f0f4fb] py-2 sm:hidden">
              <span className="font-display text-[13px] font-semibold text-muted">Presupuesto disponible</span>
              <span className="ml-auto font-mono text-lg font-bold text-accent">{miEquipo.presupuesto.toLocaleString()}</span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-7">

        {/* Gate banner */}
        {!marketplaceOpen && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="font-display text-sm font-semibold text-amber-700">
              El marketplace está cerrado — todavía no puedes comprar.
            </p>
          </div>
        )}

        {error && (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {/* Productos */}
        <section className="mb-8">
          <h2 className="mb-4 font-display text-lg font-bold text-navy">Productos disponibles</h2>
          {loading ? (
            <p className="text-sm text-muted">Cargando productos…</p>
          ) : productos.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay productos en el marketplace.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {productos.map((p) => {
                const agotado = p.stock === 0
                return (
                  <div
                    key={p.id}
                    className="flex flex-col rounded-2xl border border-[#e3ecf7] bg-white p-5 shadow-[0_1px_2px_rgba(1,40,84,0.04),0_14px_32px_-26px_rgba(1,40,84,0.3)]"
                  >
                    <p className="mb-1 font-display text-base font-bold text-navy">{p.nombre}</p>
                    {p.descripcion && (
                      <p className="mb-3 text-sm text-muted">{p.descripcion}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div>
                        <p className="font-mono text-xl font-bold text-accent">{p.precio.toLocaleString()}</p>
                        <p className={`font-mono text-[11px] ${agotado ? 'text-red-500' : 'text-muted'}`}>
                          {agotado ? 'Agotado' : `Stock: ${p.stock}`}
                        </p>
                      </div>
                      {esLider ? (
                        <button
                          type="button"
                          onClick={() => setToComprar(p)}
                          disabled={!marketplaceOpen || agotado}
                          className="accent-gradient rounded-xl px-4 py-2 font-display text-sm font-bold text-white shadow-[0_10px_24px_-14px_rgba(47,107,224,0.8)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Comprar
                        </button>
                      ) : (
                        <span className="rounded-xl border border-[#e3ecf7] px-3 py-1.5 font-display text-xs font-semibold text-muted">
                          Solo el líder compra
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Historial del equipo */}
        {miEquipo && miEquipo.compras.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-lg font-bold text-navy">
              Compras de {miEquipo.equipo_nombre}
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-[#e3ecf7] bg-white">
              <div className="min-w-[420px]">
                <div className="grid grid-cols-[2fr_1fr_1fr_1.6fr] bg-navy px-4 py-3.5">
                  {['Producto', 'Cant.', 'Total', 'Fecha'].map((col) => (
                    <span key={col} className="font-display text-[13px] font-semibold text-[#5aa9e6]">{col}</span>
                  ))}
                </div>
                {miEquipo.compras.map((c) => (
                  <div key={c.id} className="grid grid-cols-[2fr_1fr_1fr_1.6fr] items-center border-t border-[#f1f3f7] px-4 py-3">
                    <span className="text-sm font-semibold text-navy">{c.producto_nombre ?? '—'}</span>
                    <span className="font-mono text-sm text-muted">{c.cantidad}</span>
                    <span className="font-mono text-sm font-semibold text-navy">{c.total.toLocaleString()}</span>
                    <span className="font-mono text-[12px] text-muted">
                      {new Date(c.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
