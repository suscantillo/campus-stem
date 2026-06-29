import { Link } from 'react-router-dom'

export type LogoVariant = 'horizontal' | 'stacked' | 'icon'

const LOGO_SRC: Record<LogoVariant, string> = {
  horizontal: '/letrasizquierda.svg',
  stacked: '/letrasabajo.svg',
  icon: '/campusstemsinletra.svg',
}

interface LogoProps {
  className?: string
  height?: number
  variant?: LogoVariant
  /**
   * true  → sobre fondo oscuro: SVG blanco, sin filtro
   * false → sobre fondo claro: brightness(0) lo hace negro
   */
  onDark?: boolean
}

export function Logo({
  className = '',
  height = 40,
  variant = 'horizontal',
  onDark = false,
}: LogoProps) {
  return (
    <span className={`inline-flex  items-center ${className}`}>
      <img
        src={LOGO_SRC[variant]}
        alt="Campus STEM"
        style={{ height, filter: onDark ? undefined : 'brightness(0)' }}
        className="block w-auto select-none"
        draggable={false}
      />
    </span>
  )
}

export function LogoLink({
  to = '/',
  height = 40,
  variant = 'horizontal',
  onDark = false,
  className = '',
}: {
  to?: string
  height?: number
  variant?: LogoVariant
  onDark?: boolean
  className?: string
}) {
  return (
    <Link to={to} aria-label="Campus STEM — inicio" className="inline-flex shrink-0">
      <Logo height={height} variant={variant} onDark={onDark} className={className} />
    </Link>
  )
}
