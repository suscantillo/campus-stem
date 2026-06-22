import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
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
  const [form, setForm] = useState<RegisterFormData>(emptyForm)
  const [errors, setErrors] = useState<RegisterFieldErrors>({})
  const [submitted, setSubmitted] = useState(false)

  function updateField<K extends keyof RegisterFormData>(key: K, value: RegisterFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors = validateRegisterForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-[#e2e5ec] bg-white p-6 text-center">
        <p className="font-mono text-[11px] tracking-wide text-accent">// REGISTRO ENVIADO</p>
        <p className="mt-3 text-lg font-semibold text-navy">Cuenta creada (demo)</p>
        <p className="mt-2 text-sm text-muted">
          El backend aún no está conectado. Cuando lo esté, este formulario enviará los datos
          reales.
        </p>
        <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-navy underline">
          Inicia sesión
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[#e2e5ec] bg-white px-6 py-7"
      noValidate
    >
      <TextField
        label="Nombre completo"
        value={form.nombre_completo}
        onChange={(e) => updateField('nombre_completo', e.target.value)}
        error={errors.nombre_completo}
        autoComplete="name"
      />
      <TextField
        label="Colegio"
        value={form.colegio}
        onChange={(e) => updateField('colegio', e.target.value)}
        error={errors.colegio}
      />
      <SelectField
        label="Grado"
        value={form.grado}
        onChange={(e) => updateField('grado', e.target.value)}
        error={errors.grado}
        options={GRADO_OPTIONS}
      />
      <TextField
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => updateField('email', e.target.value)}
        error={errors.email}
        autoComplete="email"
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
      />
      <TextField
        label="Contraseña"
        type="password"
        value={form.password}
        onChange={(e) => updateField('password', e.target.value)}
        error={errors.password}
        autoComplete="new-password"
      />
      <TextField
        label="Confirmar contraseña"
        type="password"
        value={form.confirmPassword}
        onChange={(e) => updateField('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
        autoComplete="new-password"
        className="mb-6"
      />
      <button
        type="submit"
        className="w-full rounded-lg accent-gradient py-3.5 text-[15px] font-bold text-navy"
      >
        Registrarme
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
