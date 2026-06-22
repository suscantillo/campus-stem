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
        subtitle="30 JUN — 03 JUL · BARRANQUILLA"
      />

      <div className="min-w-[340px] flex-[0_1_520px] bg-surface px-6 py-10 md:px-10 md:py-12">
        <div className="mx-auto max-w-[420px]">
          <p className="mb-2.5 font-mono text-xs tracking-[1.5px] text-accent">// INICIAR SESIÓN</p>
          <h1 className="mb-7 text-[34px] font-bold tracking-tight text-navy">Ingresar</h1>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
