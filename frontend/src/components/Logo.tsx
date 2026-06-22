import { Link } from 'react-router-dom'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md'
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const textSize = size === 'sm' ? 'text-base' : 'text-xl'
  return (
    <span className={`font-bold tracking-tight text-white ${textSize} ${className}`}>
      CAMPUS<span className="text-gold">STEM</span>
    </span>
  )
}

export function LogoLink({ to = '/', size = 'md' }: { to?: string; size?: 'sm' | 'md' }) {
  return (
    <Link to={to}>
      <Logo size={size} />
    </Link>
  )
}
