import { Link } from 'react-router-dom'
import { LogoLink } from '../components/Logo'
import {
  calendarDays,
  infoCards,
  landingStats,
  type InfoIcon,
} from '../data/landingContent'

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

function HeroArch() {
  return (
    <svg
      viewBox="0 0 360 380"
      className="block h-auto w-full"
      fill="none"
      stroke="#012854"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M52 366 L52 172 C52 92 109 32 180 32 C251 32 308 92 308 172 L308 366" />
      {/* book */}
      <path d="M180 300 C152 288 112 288 92 296 L92 340 C112 332 152 332 180 344 C208 332 248 332 268 340 L268 296 C248 288 208 288 180 300 Z" />
      <line x1="180" y1="300" x2="180" y2="344" />
      <path
        d="M96 333 C116 326 152 326 180 337 C208 326 244 326 264 333"
        stroke="#2f6be0"
        strokeWidth="4"
      />
      {/* bulb */}
      <g transform="translate(150,116) scale(2.3)" strokeWidth="1.5">
        <path d="M12 2a8 8 0 0 0-5 14c.9.8 1.3 1.6 1.3 2.6V20h7.4v-1.4c0-1 .4-1.8 1.3-2.6A8 8 0 0 0 12 2Z" />
        <line x1="9" y1="22" x2="15" y2="22" />
        <path d="M12 8v6M9.5 11h5" stroke="#2f6be0" />
      </g>
      {/* atom */}
      <g transform="translate(96,96) scale(1.5)" strokeWidth="2">
        <circle cx="12" cy="12" r="2" />
        <ellipse cx="12" cy="12" rx="11" ry="4.2" />
        <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(120 12 12)" />
      </g>
      {/* lightning */}
      <g transform="translate(232,92) scale(1.5)" strokeWidth="2">
        <path d="M14 2 6 13h5l-1 9 9-12h-6l1-8Z" />
      </g>
      {/* chip */}
      <g transform="translate(96,188) scale(1.4)" strokeWidth="2">
        <rect x="6" y="6" width="12" height="12" rx="2.5" />
        <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
        <path d="M9 6V3M15 6V3M9 18v3M15 18v3M6 9H3M6 15H3M18 9h3M18 15h3" />
      </g>
      {/* gear */}
      <g transform="translate(228,184) scale(1.5)" strokeWidth="2">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      </g>
    </svg>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-5 border-b border-[#dde7f4] bg-white/85 px-6 py-3.5 backdrop-blur-md md:px-8">
        <LogoLink height={38} />
        <nav className="ml-auto flex items-center gap-5 md:gap-6">
          <button
            type="button"
            onClick={() => scrollToId('info')}
            className="hidden cursor-pointer font-display text-[15px] font-semibold text-[#3a4868] transition-colors hover:text-navy sm:inline"
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
          <Link
            to="/login"
            className="font-display text-[15px] font-semibold text-navy hover:underline"
          >
            Ingresar
          </Link>
          <Link
            to="/registro"
            className="accent-gradient rounded-xl px-5 py-2.5 font-display text-[15px] font-bold text-white shadow-[0_8px_20px_-10px_rgba(47,107,224,0.8)] transition-transform hover:-translate-y-0.5"
          >
            Registrarse
          </Link>
        </nav>
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

          <div className="flex min-w-[300px] flex-[0_1_380px] justify-center">
            <div className="w-full max-w-[380px] rounded-3xl bg-white p-6 shadow-[0_30px_60px_-28px_rgba(1,40,84,0.6)]">
              <HeroArch />
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

          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[18px]">
            {calendarDays.map((day) => (
              <div
                key={day.idx}
                className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/4 px-[22px] py-6"
              >
                <div className="absolute -top-[18px] right-1.5 font-display text-[120px] leading-none font-bold text-white/5">
                  {day.idx}
                </div>
                <div className="relative">
                  <div className="font-display text-[21px] font-bold text-white">{day.label}</div>
                  <div className="mt-1 mb-[18px] font-display text-sm font-semibold text-[#5aa9e6]">
                    {day.date}
                  </div>
                  {day.acts.map((act) => (
                    <div
                      key={`${act.time}-${act.name}`}
                      className="flex gap-3 border-t border-white/10 py-[11px]"
                    >
                      <span className="min-w-[42px] font-mono text-xs text-[#5aa9e6]">
                        {act.time}
                      </span>
                      <span className="text-sm text-[#cdd6e8]">{act.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            <div className="mb-3 font-display text-lg font-bold text-white">Rama IEEE Uninorte</div>
            <p className="max-w-[260px] text-sm leading-relaxed">
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
