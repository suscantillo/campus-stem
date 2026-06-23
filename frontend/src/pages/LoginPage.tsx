import { AuthSidePanel } from '../components/AuthSidePanel'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AuthSidePanel
        title={
          <>
            Bienvenido de
            <br />
            vuelta.
          </>
        }
        subtitle="30 jun – 3 jul · Barranquilla"
      />

      <div className="min-w-[340px] flex-[0_1_520px] bg-surface px-6 py-10 md:px-10 md:py-12">
        <div className="mx-auto max-w-[420px]">
          <p className="mb-2.5 font-display text-sm font-semibold text-accent">Iniciar sesión</p>
          <h1 className="mb-7 font-display text-[34px] font-bold tracking-[-1px] text-navy">
            Ingresar
          </h1>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
