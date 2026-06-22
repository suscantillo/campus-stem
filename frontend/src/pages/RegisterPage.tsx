import { AuthSidePanel } from '../components/AuthSidePanel'
import { RegisterForm } from '../components/RegisterForm'
import { useRegistrationOpen } from '../context/AdminContext'

export function RegisterPage() {
  const registroOpen = useRegistrationOpen()

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
        subtitle="30 JUN — 03 JUL · BARRANQUILLA"
      />

      <div className="min-w-[340px] flex-[0_1_520px] bg-surface px-6 py-10 md:px-10 md:py-12">
        <div className="mx-auto max-w-[420px]">
          <p className="mb-2.5 font-mono text-xs tracking-[1.5px] text-accent">// CREAR CUENTA</p>
          <h1 className="mb-7 text-[34px] font-bold tracking-tight text-navy">Registro</h1>

          {!registroOpen ? (
            <div className="rounded-md border border-[#e2e5ec] border-l-[3px] border-l-accent-alt bg-white px-6 py-8">
              <p className="mb-3 font-mono text-[11px] tracking-wide text-[#c98a00]">
                // REGISTRO CERRADO
              </p>
              <p className="mb-2 text-[19px] font-semibold text-navy">
                El registro no está abierto
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Vuelve más tarde. El registro se habilita desde el panel de administración.
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
