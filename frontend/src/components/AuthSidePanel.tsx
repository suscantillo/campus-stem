import { LogoLink } from './Logo'

interface AuthSidePanelProps {
  title: React.ReactNode
  subtitle?: string
}

export function AuthSidePanel({ title, subtitle }: AuthSidePanelProps) {
  return (
    <div className="grid-navy relative flex min-w-0 flex-1 flex-col justify-between overflow-hidden p-10 md:p-14">
      <div className="pointer-events-none absolute -top-30 -right-25 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(63,160,232,0.25),transparent_68%)]" />
      <div className="relative">
        <LogoLink to="/" height={68} variant="stacked" onDark />
      </div>
      <div className="relative">
        <h1 className="mb-4 font-display text-[clamp(30px,3.4vw,44px)] leading-[1.08] font-bold tracking-[-1px] text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="font-display text-[15px] font-semibold text-[#5aa9e6]">{subtitle}</p>
        )}
      </div>
      <p className="relative font-mono text-xs text-[#6f80a6]">IEEE · Uninorte</p>
    </div>
  )
}
