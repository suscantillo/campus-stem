import { useState, type FormEvent } from 'react'
import { ApiError, mapApiErrorToSpanish } from '../../lib/api'
import {
  createPrivilegedUser,
  type PrivilegedRole,
} from '../../lib/adminUsersApi'
import { SelectField, TextField } from '../../components/FormFields'
import { useNotification } from '../../context/NotificationContext'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'juez', label: 'Juez' },
]

interface FormState {
  nombre_completo: string
  email: string
  password: string
  rol: PrivilegedRole | ''
}

const emptyForm: FormState = {
  nombre_completo: '',
  email: '',
  password: '',
  rol: '',
}

interface FieldErrors {
  nombre_completo?: string
  email?: string
  password?: string
  rol?: string
}

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.nombre_completo.trim()) errors.nombre_completo = 'El nombre es obligatorio.'
  if (!form.email.trim()) errors.email = 'El email es obligatorio.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email inválido.'
  if (!form.password) errors.password = 'La contraseña es obligatoria.'
  else if (form.password.length < 8) errors.password = 'Mínimo 8 caracteres.'
  if (!form.rol) errors.rol = 'Selecciona un rol.'
  return errors
}

export function AdminUsersPage() {
  const { notify } = useNotification()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [createdEmail, setCreatedEmail] = useState<string | null>(null)

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
    if (apiError) setApiError(null)
    if (createdEmail) setCreatedEmail(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    setApiError(null)

    try {
      const created = await createPrivilegedUser({
        nombre_completo: form.nombre_completo.trim(),
        email: form.email.trim(),
        password: form.password,
        rol: form.rol as PrivilegedRole,
      })
      setCreatedEmail(created.email)
      setForm(emptyForm)
      notify({
        type: 'success',
        title: 'Cuenta creada',
        message: `${created.email} ya puede iniciar sesión.`,
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? mapApiErrorToSpanish(error.detail, 'No se pudo crear la cuenta.')
          : 'No se pudo conectar con el servidor.'
      setApiError(message)
      notify({ type: 'error', title: 'No se pudo crear', message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <p className="mb-6 max-w-xl text-sm leading-relaxed text-muted">
        Crea cuentas de administrador o juez para el equipo organizador. Solo el super admin
        puede usar esta pantalla.
      </p>

      {createdEmail ? (
        <div
          className="mb-6 rounded-2xl border border-[#e3ecf7] border-l-[3px] border-l-accent bg-white px-5 py-4"
          role="status"
        >
          <p className="font-display text-[13px] font-semibold text-accent">Cuenta creada</p>
          <p className="mt-2 text-sm text-navy">
            Usuario <span className="font-semibold">{createdEmail}</span> registrado correctamente.
          </p>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="max-w-lg rounded-2xl border border-[#e3ecf7] bg-white px-6 py-7 shadow-[0_1px_2px_rgba(1,40,84,0.04),0_18px_40px_-30px_rgba(1,40,84,0.35)]"
        noValidate
      >
        {apiError ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {apiError}
          </p>
        ) : null}

        <TextField
          label="Nombre completo"
          value={form.nombre_completo}
          onChange={(e) => updateField('nombre_completo', e.target.value)}
          error={errors.nombre_completo}
          disabled={loading}
        />
        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          error={errors.email}
          autoComplete="off"
          disabled={loading}
        />
        <SelectField
          label="Rol"
          value={form.rol}
          onChange={(e) => updateField('rol', e.target.value as PrivilegedRole | '')}
          error={errors.rol}
          options={ROLE_OPTIONS}
          disabled={loading}
        />
        <TextField
          label="Contraseña inicial"
          type="password"
          value={form.password}
          onChange={(e) => updateField('password', e.target.value)}
          error={errors.password}
          autoComplete="new-password"
          className="mb-6"
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="accent-gradient w-full rounded-xl py-3.5 font-display text-[15px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(47,107,224,0.8)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
    </>
  )
}
