const PHONE_PATTERN = /^3\d{9}$/

export interface RegisterFormData {
  nombre_completo: string
  colegio: string
  grado: string
  email: string
  telefono: string
  password: string
  confirmPassword: string
}

export type RegisterFieldErrors = Partial<Record<keyof RegisterFormData, string>>

export function validateRegisterForm(data: RegisterFormData): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {}

  if (!data.nombre_completo.trim()) {
    errors.nombre_completo = 'El nombre es obligatorio.'
  }
  if (!data.colegio.trim()) {
    errors.colegio = 'El colegio es obligatorio.'
  }
  if (!data.grado) {
    errors.grado = 'Selecciona un grado.'
  }
  if (!data.email.trim()) {
    errors.email = 'El email es obligatorio.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Ingresa un email válido.'
  }
  if (!data.telefono.trim()) {
    errors.telefono = 'El teléfono es obligatorio.'
  } else if (!PHONE_PATTERN.test(data.telefono.trim())) {
    errors.telefono = 'Debe ser un celular colombiano de 10 dígitos que inicie en 3.'
  }
  if (!data.password) {
    errors.password = 'La contraseña es obligatoria.'
  } else if (data.password.length < 8) {
    errors.password = 'Mínimo 8 caracteres.'
  }
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Confirma tu contraseña.'
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.'
  }

  return errors
}

export interface LoginFormData {
  email: string
  password: string
}

export type LoginFieldErrors = Partial<Record<keyof LoginFormData, string>>

export function validateLoginForm(data: LoginFormData): LoginFieldErrors {
  const errors: LoginFieldErrors = {}
  if (!data.email.trim()) errors.email = 'El email es obligatorio.'
  if (!data.password) errors.password = 'La contraseña es obligatoria.'
  return errors
}
