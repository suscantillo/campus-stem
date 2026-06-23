import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError, mapApiErrorToSpanish } from '../lib/api'
import { getPostLoginPath } from '../lib/auth'
import { login } from '../lib/authApi'
import { validateLoginForm, type LoginFieldErrors, type LoginFormData } from '../lib/validation'
import { TextField } from './FormFields'

export function LoginForm() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [form, setForm] = useState<LoginFormData>({ email: '', password: '' })
  const [errors, setErrors] = useState<LoginFieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function updateField<K extends keyof LoginFormData>(key: K, value: LoginFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
    if (apiError) setApiError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors = validateLoginForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    setApiError(null)

    try {
      const data = await login({
        email: form.email.trim().replace(/\.+$/, ''),
        password: form.password,
      })
      setSession(data)
      navigate(getPostLoginPath(data.user.rol))
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(mapApiErrorToSpanish(error.detail, 'No se pudo iniciar sesión.'))
      } else {
        setApiError('No se pudo conectar con el servidor. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
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
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => updateField('email', e.target.value)}
        error={errors.email}
        autoComplete="email"
        disabled={loading}
      />
      <TextField
        label="Contraseña"
        type="password"
        value={form.password}
        onChange={(e) => updateField('password', e.target.value)}
        error={errors.password}
        autoComplete="current-password"
        className="mb-6"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="accent-gradient w-full rounded-xl py-3.5 font-display text-[15px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(47,107,224,0.8)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Ingresando…' : 'Ingresar'}
      </button>
      <p className="mt-4 text-center text-[13px] text-muted">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-navy underline">
          Regístrate
        </Link>
      </p>
    </form>
  )
}
