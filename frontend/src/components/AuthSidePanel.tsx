import { LogoLink } from './Logo'

interface AuthSidePanelProps {
  title: React.ReactNode
  subtitle?: string
}

export function AuthSidePanel({ title, subtitle }: AuthSidePanelProps) {
  return (
    <div className="grid-gold relative flex min-w-0 flex-1 flex-col justify-between overflow-hidden p-10 md:p-14">
      <LogoLink to="/" />
      <div>
        <h1 className="mb-4 text-[clamp(30px,3.4vw,46px)] leading-tight font-bold tracking-tight text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="font-mono text-xs tracking-wide text-gold">{subtitle}</p>
        )}
      </div>
      <p className="font-mono text-[11px] tracking-wide text-[#6f80a6]">IEEE · UNINORTE</p>
    </div>
  )
}
