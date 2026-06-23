import { AuthSidePanel } from '../components/AuthSidePanel'
import { RegisterForm } from '../components/RegisterForm'
import { useRegistrationStatus } from '../hooks/useRegistrationStatus'

export function RegisterPage() {
  const registroOpen = useRegistrationStatus()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AuthSidePanel
        title={
          <>
            Únete a la
            <br />
            edición 2026.
          </>
        }
        subtitle="30 jun – 3 jul · Barranquilla"
      />

      <div className="min-w-[340px] flex-[0_1_520px] bg-surface px-6 py-10 md:px-10 md:py-12">
        <div className="mx-auto max-w-[420px]">
          <p className="mb-2.5 font-display text-sm font-semibold text-accent">Crear cuenta</p>
          <h1 className="mb-7 font-display text-[34px] font-bold tracking-[-1px] text-navy">
            Registro
          </h1>

          {registroOpen === null ? (
            <p className="text-sm text-muted">Verificando disponibilidad del registro…</p>
          ) : !registroOpen ? (
            <div className="rounded-xl border border-[#d7e3f3] border-l-[3px] border-l-accent bg-white px-6 py-8">
              <p className="mb-3 font-display text-[13px] font-semibold text-accent">
                Registro cerrado
              </p>
              <p className="mb-2 font-display text-xl font-bold text-navy">
                El registro no está abierto
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Vuelve más tarde. El administrador habilitará el registro cuando corresponda.
              </p>
            </div>
          ) : (
            <RegisterForm />
          )}
        </div>
      </div>
    </div>
  )
}
