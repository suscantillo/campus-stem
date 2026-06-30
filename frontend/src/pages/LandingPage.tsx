import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo, LogoLink } from '../components/Logo'
import { UserAvatar } from '../components/UserAvatar'
import { useAuth } from '../context/AuthContext'
import {
  calendarDays,
  infoCards,
  landingStats,
  type InfoIcon,
} from '../data/landingContent'
import { getHeliosStatus } from '../lib/heliosApi'

const HERO_PHOTOS = [
  '/fotos/WhatsApp Image 2026-06-23 at 3.49.09 PM.jpeg',
  '/fotos/WhatsApp Image 2026-06-23 at 3.49.09 PM (1).jpeg',
  '/fotos/WhatsApp Image 2026-06-23 at 3.49.09 PM (2).jpeg',
  '/fotos/WhatsApp Image 2026-06-23 at 3.49.10 PM.jpeg',
  '/fotos/WhatsApp Image 2026-06-23 at 3.49.10 PM (1).jpeg',
  '/fotos/WhatsApp Image 2026-06-23 at 3.49.10 PM (2).jpeg',
]

function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const pausedRef = useRef(false)

  const goTo = (idx: number) => {
    if (animating) return
    setAnimating(true)
    setCurrent((idx + HERO_PHOTOS.length) % HERO_PHOTOS.length)
    setTimeout(() => setAnimating(false), 600)
  }

  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) goTo(current + 1)
    }, 4200)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl"
      style={{ aspectRatio: '4/5' }}
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
    >
      {/* ───── slides ───── */}
      <div
        className="flex h-full transition-transform duration-[600ms] ease-in-out will-change-transform"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {HERO_PHOTOS.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Campus STEM foto ${i + 1}`}
            className="h-full w-full shrink-0 object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        ))}
      </div>

      {/* ───── gradient overlays ───── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#012854]/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#012854]/75 to-transparent" />

      {/* ───── nav arrows ───── */}
      <button
        type="button"
        onClick={() => goTo(current - 1)}
        aria-label="Foto anterior"
        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-[#012854]/45 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-[#012854]/70 group-hover:opacity-100 sm:opacity-60 sm:hover:opacity-100"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => goTo(current + 1)}
        aria-label="Foto siguiente"
        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-[#012854]/45 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-[#012854]/70 group-hover:opacity-100 sm:opacity-60 sm:hover:opacity-100"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* ───── dots ───── */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
        {HERO_PHOTOS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ir a foto ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'h-2 w-6 bg-[#5aa9e6]'
                : 'h-2 w-2 bg-white/45 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* ───── corner badge ───── */}
      <div className="absolute top-3.5 right-4 rounded-full border border-white/25 bg-[#012854]/55 px-3 py-1 backdrop-blur-sm">
        <span className="font-display text-[11px] font-semibold text-[#bcd3f2]">
          {current + 1} / {HERO_PHOTOS.length}
        </span>
      </div>
    </div>
  )
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function InfoIconGlyph({ icon }: { icon: InfoIcon }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (icon === 'chip') {
    return (
      <svg {...common}>
        <rect x="6" y="6" width="12" height="12" rx="2.5" />
        <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
        <path d="M9 6V3M15 6V3M9 18v3M15 18v3M6 9H3M6 15H3M18 9h3M18 15h3" />
      </svg>
    )
  }
  if (icon === 'atom') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="1.8" />
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M12 2a8 8 0 0 0-5 14c.9.8 1.3 1.6 1.3 2.6V20h7.4v-1.4c0-1 .4-1.8 1.3-2.6A8 8 0 0 0 12 2Z" />
      <line x1="9" y1="22" x2="15" y2="22" />
    </svg>
  )
}


export function LandingPage() {
  const { user, isAuthenticated, logout } = useAuth()
  const isEstudiante = user?.rol === 'estudiante'
  const [heliosAbierto, setHeliosAbierto] = useState(false)

  useEffect(() => {
    void getHeliosStatus().then(d => setHeliosAbierto(d.helios_abierto)).catch(() => {})
  }, [])

  async function handleLogout() {
    await logout()
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#dde7f4] bg-white/90 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3 sm:gap-5 sm:px-8">
          <LogoLink height={80} />

          {/* Info/Calendario — solo desktop */}
          <button
            type="button"
            onClick={() => scrollToId('info')}
            className="ml-4 hidden cursor-pointer font-display text-[15px] font-semibold text-[#3a4868] transition-colors hover:text-navy sm:inline"
          >
            Info
          </button>
          <button
            type="button"
            onClick={() => scrollToId('calendario')}
            className="hidden cursor-pointer font-display text-[15px] font-semibold text-[#3a4868] transition-colors hover:text-navy sm:inline"
          >
            Calendario
          </button>

          <nav className="ml-auto flex items-center gap-2 sm:gap-3">
            {isAuthenticated && isEstudiante ? (
              <>
                <Link
                  to="/mi-equipo"
                  className="font-display text-[13px] font-semibold text-[#3a4868] transition-colors hover:text-navy sm:text-[15px]"
                >
                  Mi Equipo
                </Link>
                <Link
                  to="/marketplace"
                  className="font-display text-[13px] font-semibold text-[#3a4868] transition-colors hover:text-navy sm:text-[15px]"
                >
                  Marketplace
                </Link>
                <UserAvatar name={user.nombre_completo} />
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-xl border border-[#cdd9ec] px-3 py-2 font-display text-[13px] font-semibold text-navy hover:bg-[#f1f5fb] sm:px-4"
                >
                  Salir
                </button>
              </>
            ) : isAuthenticated && !isEstudiante ? (
              <>
                <Link
                  to="/admin"
                  className="font-display text-[14px] font-semibold text-[#3a4868] hover:text-navy"
                >
                  Panel admin
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-xl border border-[#cdd9ec] px-3 py-2 font-display text-[13px] font-semibold text-navy hover:bg-[#f1f5fb] sm:px-4"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-display text-[14px] font-semibold text-navy hover:underline sm:text-[15px]"
                >
                  Ingresar
                </Link>
                <Link
                  to="/registro"
                  className="accent-gradient rounded-xl px-4 py-2.5 font-display text-[14px] font-bold text-white shadow-[0_8px_20px_-10px_rgba(47,107,224,0.8)] transition-transform hover:-translate-y-0.5 sm:px-5 sm:text-[15px]"
                >
                  Registrarse
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="grid-navy relative overflow-hidden">
        <div className="pointer-events-none absolute -top-44 -right-28 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(63,160,232,0.28),transparent_66%)]" />
        <div className="relative mx-auto flex max-w-[1180px] flex-wrap items-center gap-14 px-6 pt-18 pb-20 md:px-8">
          <div className="min-w-[320px] flex-1">
            <span className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/8 px-4 py-2 font-display text-sm font-semibold text-[#bcd3f2]">
              30 jun – 3 jul · 2026
            </span>
            <h1 className="font-display text-[clamp(48px,7.5vw,82px)] leading-none font-bold tracking-[-1px] text-white">
              Aprende.
              <br />
              Crea.
              <br />
              <span className="text-[#5aa9e6]">Inventa.</span>
            </h1>
            <p className="mt-7 mb-9 max-w-[430px] text-lg leading-relaxed text-[#aebfdc]">
              Cuatro días de talleres, charlas y un hackathon en ciencia, tecnología, ingeniería y
              matemáticas para estudiantes de Barranquilla.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Link
                to="/registro"
                className="rounded-xl bg-white px-8 py-4 font-display text-base font-bold text-navy transition-transform hover:-translate-y-0.5"
              >
                Registrarme
              </Link>
              <button
                type="button"
                onClick={() => scrollToId('calendario')}
                className="rounded-xl border border-white/30 px-7 py-4 font-display text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                Ver calendario
              </button>
            </div>
          </div>

          <div className="group flex min-w-[280px] flex-[0_1_400px] justify-center">
            <div className="w-full max-w-[400px] shadow-[0_40px_80px_-30px_rgba(1,40,84,0.8)]" style={{ borderRadius: '1.5rem' }}>
              <HeroCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-b border-[#e3ecf7] bg-white">
        <div className="mx-auto grid max-w-[1180px] grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-6 px-6 py-9 md:px-8">
          {landingStats.map((st) => (
            <div key={st.l}>
              <div className="font-display text-[48px] leading-none font-bold tracking-[-1px] text-accent">
                {st.n}
              </div>
              <div className="mt-2 font-display text-sm font-semibold text-[#5a6f96]">{st.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Información */}
      <section id="info" className="scroll-mt-16 bg-surface">
        <div className="mx-auto max-w-[1180px] px-6 py-20 md:px-8 md:py-22">
          <div className="mb-14 flex flex-wrap gap-16">
            <div className="w-[280px] shrink-0">
              <p className="mb-3.5 font-display text-sm font-semibold text-accent">¿Qué es?</p>
              <h2 className="font-display text-[clamp(32px,4vw,44px)] leading-[1.05] font-bold tracking-[-1px] text-navy">
                Campus STEM
              </h2>
            </div>
            <p className="max-w-[640px] min-w-[300px] flex-1 text-lg leading-[1.8] text-[#46557a]">
              Campus STEM es una actividad dirigida a estudiantes principalmente de 9.°, 10.° y
              11.° de instituciones públicas y privadas de Barranquilla, que busca incentivar el
              interés por carreras en el área de la ciencia, la tecnología, la ingeniería y las
              matemáticas. A lo largo de 4 días, los estudiantes podrán participar en talleres y
              charlas de ingeniería eléctrica, electrónica y biomédica, junto con un hackathon en
              el que practicarán habilidades técnicas y blandas. También habrá actividades de
              esparcimiento y de rompehielo.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {infoCards.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-[#e3ecf7] bg-white p-7 shadow-[0_1px_2px_rgba(1,40,84,0.04),0_18px_40px_-28px_rgba(1,40,84,0.3)]"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[50%_50%_16px_16px] border-2 border-navy text-navy">
                  <InfoIconGlyph icon={card.icon} />
                </div>
                <h3 className="mb-2.5 font-display text-[21px] font-bold text-navy">
                  {card.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-[#6b768f]">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calendario */}
      <section id="calendario" className="grid-navy relative scroll-mt-16">
        <div className="relative mx-auto max-w-[1180px] px-6 py-20 md:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 font-display text-sm font-semibold text-[#5aa9e6]">Agenda</p>
              <h2 className="font-display text-[clamp(32px,4vw,44px)] font-bold tracking-[-1px] text-white">
                Calendario
              </h2>
            </div>
            <p className="font-display text-sm font-semibold text-[#8aa0c8]">
              4 días · 30 jun – 3 jul
            </p>
          </div>

          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
            {calendarDays.map((day) => (
              <div
                key={day.idx}
                className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/4 px-[22px] py-6"
              >
                {/* Número decorativo de fondo */}
                <div className="absolute -top-[18px] right-1.5 font-display text-[120px] leading-none font-bold text-white/5 select-none">
                  {day.idx}
                </div>

                <div className="relative">
                  {/* Encabezado del día */}
                  <div className="mb-3.5">
                    <p className="mb-0.5 font-mono text-[10px] tracking-[1.5px] text-[#5aa9e6] uppercase">
                      Día {day.idx} · {day.date}
                    </p>
                    <h3 className="font-display text-[20px] font-bold leading-tight text-white">
                      {day.label}
                    </h3>
                    <p className="mt-1 text-[13px] leading-snug text-[#8aa0c8]">{day.theme}</p>
                  </div>

                  {/* Actividades */}
                  {day.acts.map((act) => (
                    <div
                      key={`${act.time}-${act.name}`}
                      className="flex gap-3 border-t border-white/10 py-2.5"
                    >
                      <span className="min-w-[38px] shrink-0 font-mono text-[11px] text-[#5aa9e6]">
                        {act.time}
                      </span>
                      <span className="text-[13px] leading-snug text-[#cdd6e8]">{act.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Helios Escape Room */}
      {heliosAbierto && (
        <section className="relative overflow-hidden bg-[#030d08]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,255,136,0.12),transparent)]" />
          <div className="relative mx-auto flex max-w-[1180px] flex-wrap items-center gap-12 px-6 py-16 md:px-8 md:py-20">
            {/* Text */}
            <div className="min-w-[280px] flex-1">
              <p className="mb-3 font-mono text-[11px] tracking-[4px] text-[#00aa55]">SISTEMA ACTIVO</p>
              <h2 className="font-mono text-[clamp(28px,4vw,46px)] font-bold leading-[1.1] tracking-[-1px] text-[#00ff88]">
                PROYECTO HELIOS
              </h2>
              <p className="mt-4 max-w-md font-mono text-[14px] leading-relaxed text-[#4a8a6a]">
                La microred de la universidad ha sido comprometida. Tienes 2 horas para recorrer el campus, recuperar los fragmentos de la clave y restaurar el sistema antes de que sea demasiado tarde.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {isAuthenticated && isEstudiante ? (
                  <Link
                    to="/helios"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#00ff88] bg-[#00ff88] px-8 py-3.5 font-mono text-[15px] font-bold text-[#030d08] transition-all hover:bg-[#00dd77] hover:shadow-[0_0_24px_rgba(0,255,136,0.4)]"
                  >
                    ACCEDER AL SISTEMA
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#00ff88] bg-transparent px-8 py-3.5 font-mono text-[15px] font-bold text-[#00ff88] transition-all hover:bg-[#00ff88] hover:text-[#030d08] hover:shadow-[0_0_24px_rgba(0,255,136,0.35)]"
                  >
                    INICIAR SESIÓN PARA ACCEDER
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                )}
              </div>
            </div>

            {/* Terminal panel */}
            <div className="w-full max-w-[360px] shrink-0 rounded-2xl border border-[#1a3a2a] bg-[#050f0a] p-5 font-mono text-[12px] shadow-[0_0_40px_rgba(0,255,136,0.08)]">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#ff4444]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#ffaa00]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#00ff88]" />
                <span className="ml-2 text-[#1a3a2a]">helios_system.log</span>
              </div>
              <div className="space-y-1.5 text-[#4a7a5a]">
                <p><span className="text-[#00ff88]">$</span> status --all</p>
                <p className="text-[#ff4444]">GENERACIÓN SOLAR: 0%</p>
                <p className="text-[#ff4444]">RED ELÉCTRICA: DESCONECTADA</p>
                <p className="text-[#ffaa00]">BATERÍAS: 18%</p>
                <p className="text-[#ff4444]">TRANSFERENCIA EN CURSO...</p>
                <p className="mt-3"><span className="text-[#00ff88]">$</span> tiempo_restante</p>
                <p className="text-[#ffaa00] font-bold">02:00:00</p>
                <p className="mt-3 text-[#00ff88]">_ <span className="animate-pulse">█</span></p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA band */}
      <section className="accent-gradient">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-8 px-6 py-15 md:px-8">
          <h2 className="font-display text-[clamp(28px,4vw,46px)] leading-[1.05] font-bold tracking-[-1px] text-white">
            ¿Listo para participar?
          </h2>
          <Link
            to="/registro"
            className="rounded-xl bg-white px-9 py-[18px] font-display text-base font-bold text-navy transition-transform hover:-translate-y-0.5"
          >
            Crear cuenta
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-dark text-[#8a98ba]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap justify-between gap-10 px-6 py-13 md:px-8">
          <div>
            <Logo height={64} variant="stacked" onDark className="mb-4" />
            <p className="max-w-[240px] text-sm leading-relaxed">
              Organizado por la Rama Estudiantil IEEE de la Universidad del Norte, Barranquilla.
            </p>
          </div>
          <div className="flex gap-14">
            <div>
              <div className="mb-3.5 font-display text-[13px] font-semibold text-[#5e6f96]">
                Enlaces
              </div>
              <button
                type="button"
                onClick={() => scrollToId('info')}
                className="mb-2.5 block cursor-pointer text-sm hover:text-white"
              >
                Información
              </button>
              <button
                type="button"
                onClick={() => scrollToId('calendario')}
                className="mb-2.5 block cursor-pointer text-sm hover:text-white"
              >
                Calendario
              </button>
              <span className="block text-sm">Contacto</span>
            </div>
            <div>
              <div className="mb-3.5 font-display text-[13px] font-semibold text-[#5e6f96]">
                Redes
              </div>
              <div className="flex gap-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[34px] w-[34px] rounded-full border border-[#5aa9e6]/50" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
