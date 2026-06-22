import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { validateLoginForm, type LoginFieldErrors, type LoginFormData } from '../lib/validation'
import { TextField } from './FormFields'

export function LoginForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState<LoginFormData>({ email: '', password: '' })
  const [errors, setErrors] = useState<LoginFieldErrors>({})

  function updateField<K extends keyof LoginFormData>(key: K, value: LoginFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors = validateLoginForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    navigate('/admin')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[#e2e5ec] bg-white px-6 py-7"
      noValidate
    >
      <TextField
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => updateField('email', e.target.value)}
        error={errors.email}
        autoComplete="email"
      />
      <TextField
        label="Contraseña"
        type="password"
        value={form.password}
        onChange={(e) => updateField('password', e.target.value)}
        error={errors.password}
        autoComplete="current-password"
        className="mb-6"
      />
      <button
        type="submit"
        className="w-full rounded-lg accent-gradient py-3.5 text-[15px] font-bold text-navy"
      >
        Ingresar
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
