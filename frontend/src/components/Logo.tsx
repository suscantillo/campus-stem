import { Link } from 'react-router-dom'

interface LogoProps {
  className?: string
  /** Height of the logo image in px */
  height?: number
  /** Wrap the logo in a white rounded badge so the dark line-art stays visible on dark surfaces */
  onDark?: boolean
}

export function Logo({ className = '', height = 40, onDark = false }: LogoProps) {
  const img = (
    <img
      src="/logo.png"
      alt="Campus STEM"
      style={{ height }}
      className="block w-auto select-none"
      draggable={false}
    />
  )

  if (onDark) {
    return (
      <span
        className={`inline-flex items-center rounded-xl bg-white px-2.5 py-1.5 shadow-sm ${className}`}
      >
        {img}
      </span>
    )
  }

  return <span className={`inline-flex items-center ${className}`}>{img}</span>
}

export function LogoLink({
  to = '/',
  height = 40,
  onDark = false,
  className = '',
}: {
  to?: string
  height?: number
  onDark?: boolean
  className?: string
}) {
  return (
    <Link to={to} aria-label="Campus STEM — inicio" className="inline-flex">
      <Logo height={height} onDark={onDark} className={className} />
    </Link>
  )
}
