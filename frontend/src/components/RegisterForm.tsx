import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { ApiError, mapApiErrorToSpanish } from '../lib/api'
import { getPostLoginPath } from '../lib/auth'
import { registerStudent } from '../lib/authApi'
import {
  validateRegisterForm,
  type RegisterFieldErrors,
  type RegisterFormData,
} from '../lib/validation'
import { SelectField, TextField } from './FormFields'

const GRADO_OPTIONS = [
  { value: '9', label: '9.°' },
  { value: '10', label: '10.°' },
  { value: '11', label: '11.°' },
]

const emptyForm: RegisterFormData = {
  nombre_completo: '',
  colegio: '',
  grado: '',
  email: '',
  telefono: '',
  password: '',
  confirmPassword: '',
}

export function RegisterForm() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const { notify } = useNotification()
  const [form, setForm] = useState<RegisterFormData>(emptyForm)
  const [errors, setErrors] = useState<RegisterFieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successName, setSuccessName] = useState<string | null>(null)
  const [successRedirectPath, setSuccessRedirectPath] = useState('/')

  useEffect(() => {
    if (!successName) return

    const timer = window.setTimeout(() => {
      navigate(successRedirectPath)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [successName, successRedirectPath, navigate])

  function updateField<K extends keyof RegisterFormData>(key: K, value: RegisterFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
    if (apiError) setApiError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors = validateRegisterForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    setApiError(null)

    try {
      const data = await registerStudent({
        nombre_completo: form.nombre_completo.trim(),
        colegio: form.colegio.trim(),
        grado: Number(form.grado),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        password: form.password,
      })
      setSession(data)
      setSuccessRedirectPath(getPostLoginPath(data.user.rol))
      setSuccessName(data.user.nombre_completo)
      notify({
        type: 'success',
        title: '¡Registro completado!',
        message: `Bienvenido, ${data.user.nombre_completo}. Tu cuenta está lista.`,
      })
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(mapApiErrorToSpanish(error.detail, 'No se pudo completar el registro.'))
      } else {
        setApiError('No se pudo conectar con el servidor. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (successName) {
    return (
      <div
        className="rounded-2xl border border-[#e3ecf7] border-l-[3px] border-l-accent bg-white px-6 py-8 text-center shadow-[0_1px_2px_rgba(1,40,84,0.04),0_18px_40px_-30px_rgba(1,40,84,0.35)]"
        role="status"
        aria-live="polite"
      >
        <p className="font-display text-[13px] font-semibold text-accent">Registro exitoso</p>
        <p className="mt-3 font-display text-xl font-bold text-navy">
          ¡Bienvenido, {successName}!
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Tu cuenta fue creada correctamente. Ya puedes participar en Campus STEM.
        </p>
        <p className="mt-4 font-mono text-[11px] text-muted">
          Redirigiendo al inicio en unos segundos…
        </p>
        <button
          type="button"
          onClick={() => navigate(successRedirectPath)}
          className="accent-gradient mt-5 w-full rounded-xl py-3 font-display text-[15px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(47,107,224,0.8)]"
        >
          Ir al inicio ahora
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#e3ecf7] bg-white px-6 py-7 shadow-[0_1px_2px_rgba(1,40,84,0.04),0_18px_40px_-30px_rgba(1,40,84,0.35)]"
      noValidate
    >
      {apiError ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {apiError}
        </p>
      ) : null}

      <TextField
        label="Nombre completo"
        value={form.nombre_completo}
        onChange={(e) => updateField('nombre_completo', e.target.value)}
        error={errors.nombre_completo}
        autoComplete="name"
        disabled={loading}
      />
      <TextField
        label="Colegio"
        value={form.colegio}
        onChange={(e) => updateField('colegio', e.target.value)}
        error={errors.colegio}
        disabled={loading}
      />
      <SelectField
        label="Grado"
        value={form.grado}
        onChange={(e) => updateField('grado', e.target.value)}
        error={errors.grado}
        options={GRADO_OPTIONS}
        disabled={loading}
      />
      <TextField
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => updateField('email', e.target.value)}
        error={errors.email}
        autoComplete="email"
        disabled={loading}
      />
      <TextField
        label="Número de teléfono"
        type="tel"
        inputMode="numeric"
        placeholder="3001234567"
        value={form.telefono}
        onChange={(e) => updateField('telefono', e.target.value)}
        error={errors.telefono}
        autoComplete="tel"
        disabled={loading}
      />
      <TextField
        label="Contraseña"
        type="password"
        value={form.password}
        onChange={(e) => updateField('password', e.target.value)}
        error={errors.password}
        autoComplete="new-password"
        disabled={loading}
      />
      <TextField
        label="Confirmar contraseña"
        type="password"
        value={form.confirmPassword}
        onChange={(e) => updateField('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
        autoComplete="new-password"
        className="mb-6"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="accent-gradient w-full rounded-xl py-3.5 font-display text-[15px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(47,107,224,0.8)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Registrando…' : 'Registrarme'}
      </button>
      <p className="mt-4 text-center text-[13px] text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-navy underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}
