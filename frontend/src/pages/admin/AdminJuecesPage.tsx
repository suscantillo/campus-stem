import { useCallback, useEffect, useState } from 'react'
import { TextField } from '../../components/FormFields'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import { ApiError, mapApiErrorToSpanish } from '../../lib/api'
import {
  createPrivilegedUser,
  deleteJuez,
  listJueces,
  updateJuez,
  type PrivilegedUser,
} from '../../lib/adminUsersApi'
import { isSuperAdmin } from '../../lib/auth'

// ── Edit modal ─────────────────────────────────────────────────────────────────

function EditModal({
  juez,
  onClose,
  onSaved,
}: {
  juez: PrivilegedUser
  onClose: () => void
  onSaved: (updated: PrivilegedUser) => void
}) {
  const { notify } = useNotification()
  const [nombre, setNombre] = useState(juez.nombre_completo)
  const [email, setEmail] = useState(juez.email)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const payload: Record<string, string> = {}
      if (nombre.trim() !== juez.nombre_completo) payload.nombre_completo = nombre.trim()
      if (email.trim().toLowerCase() !== juez.email) payload.email = email.trim()
      if (password) payload.password = password

      if (Object.keys(payload).length === 0) { onClose(); return }

      const updated = await updateJuez(juez.id, payload)
      notify({ type: 'success', title: 'Juez actualizado', message: updated.email })
      onSaved(updated)
    } catch (err) {
      setError(err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo actualizar.') : 'Error de conexión.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(1,40,84,0.4)] px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#e3ecf7] bg-white p-6 shadow-[0_24px_56px_-16px_rgba(1,40,84,0.35)]">
        <h3 className="mb-4 font-display text-lg font-bold text-navy">Editar juez</h3>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={e => void handleSave(e)} className="space-y-0">
          <TextField
            label="Nombre completo"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            disabled={saving}
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={saving}
          />
          <TextField
            label="Nueva contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={saving}
            className="mb-6"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-[#cdd9ec] py-2.5 font-display text-sm font-semibold text-navy hover:bg-[#f1f5fb]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 accent-gradient rounded-xl py-2.5 font-display text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function AdminJuecesPage() {
  const { user } = useAuth()
  const { notify } = useNotification()
  const canCreate = user ? isSuperAdmin(user.rol) : false

  const [jueces, setJueces] = useState<PrivilegedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<PrivilegedUser | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // create form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre_completo: '', email: '', password: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setJueces(await listJueces()) }
    catch { notify({ type: 'error', title: 'Error', message: 'No se pudo cargar la lista de jueces.' }) }
    finally { setLoading(false) }
  }, [notify])

  useEffect(() => { void load() }, [load])

  async function handleDelete(j: PrivilegedUser) {
    if (!window.confirm(`¿Eliminar al juez "${j.nombre_completo}"? Esta acción no se puede deshacer.`)) return
    setDeleting(j.id)
    try {
      await deleteJuez(j.id)
      setJueces(prev => prev.filter(x => x.id !== j.id))
      notify({ type: 'success', title: 'Juez eliminado', message: j.email })
    } catch (err) {
      notify({ type: 'error', title: 'Error', message: err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo eliminar.') : 'Error.' })
    } finally { setDeleting(null) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null); setCreating(true)
    try {
      const created = await createPrivilegedUser({ ...form, rol: 'juez' })
      setJueces(prev => [...prev, created].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo)))
      setForm({ nombre_completo: '', email: '', password: '' })
      setShowForm(false)
      notify({ type: 'success', title: 'Juez creado', message: created.email })
    } catch (err) {
      setFormError(err instanceof ApiError ? mapApiErrorToSpanish(err.detail, 'No se pudo crear el juez.') : 'Error de conexión.')
    } finally { setCreating(false) }
  }

  return (
    <>
      {editing && (
        <EditModal
          juez={editing}
          onClose={() => setEditing(null)}
          onSaved={updated => {
            setJueces(prev => prev.map(j => j.id === updated.id ? updated : j))
            setEditing(null)
          }}
        />
      )}

      <p className="mb-5 max-w-xl text-sm text-muted">
        Lista completa de jueces registrados. Puedes editar sus datos o eliminarlos.
        {canCreate ? ' Para crear un juez nuevo usa el formulario de abajo.' : ''}
      </p>

      {/* Table */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[#e3ecf7] bg-white shadow-[0_1px_2px_rgba(1,40,84,0.04)]">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted">Cargando…</p>
        ) : jueces.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <p className="font-display text-base font-bold text-navy">No hay jueces registrados</p>
            <p className="mt-1 text-sm text-muted">
              {canCreate ? 'Crea el primero con el formulario de abajo.' : 'El super admin puede crear jueces en la sección Usuarios.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-[#f1f3f7] bg-navy">
                  {['Nombre', 'Email', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-display text-[11px] font-semibold uppercase tracking-wider text-[#5aa9e6]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jueces.map(j => (
                  <tr key={j.id} className="border-t border-[#f1f3f7] hover:bg-[#f8fafd]">
                    <td className="px-5 py-3">
                      <p className="font-display text-sm font-semibold text-navy">{j.nombre_completo}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-[13px] text-muted">{j.email}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(j)}
                          className="rounded-lg border border-[#cdd9ec] px-3 py-1.5 font-display text-[12px] font-semibold text-navy hover:bg-[#f1f5fb]"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(j)}
                          disabled={deleting === j.id}
                          className="rounded-lg border border-red-200 px-3 py-1.5 font-display text-[12px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deleting === j.id ? '…' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create form — super_admin only */}
      {canCreate && (
        <div className="max-w-lg rounded-2xl border border-[#e3ecf7] bg-white px-6 py-5 shadow-[0_1px_2px_rgba(1,40,84,0.04),0_18px_40px_-30px_rgba(1,40,84,0.35)]">
          <button
            type="button"
            onClick={() => setShowForm(v => !v)}
            className="flex w-full items-center justify-between font-display text-base font-bold text-navy"
          >
            <span>Agregar juez</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa3b8" strokeWidth="2" strokeLinecap="round"
              className={`transition-transform ${showForm ? 'rotate-180' : ''}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showForm && (
            <form onSubmit={e => void handleCreate(e)} className="mt-4 space-y-0">
              {formError && (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
              )}
              <TextField
                label="Nombre completo"
                value={form.nombre_completo}
                onChange={e => setForm(p => ({ ...p, nombre_completo: e.target.value }))}
                disabled={creating}
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                disabled={creating}
              />
              <TextField
                label="Contraseña inicial"
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                disabled={creating}
                className="mb-5"
              />
              <button
                type="submit"
                disabled={creating}
                className="accent-gradient w-full rounded-xl py-3 font-display text-[15px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(47,107,224,0.8)] disabled:opacity-60"
              >
                {creating ? 'Creando…' : 'Crear juez'}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
