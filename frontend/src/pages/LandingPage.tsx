import { Link } from 'react-router-dom'
import { LogoLink } from '../components/Logo'
import {
  calendarDays,
  infoCards,
  landingSpecs,
  landingStats,
} from '../data/landingContent'

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-navy-dark">
      <header className="sticky top-0 z-10 flex items-center gap-5 border-b border-white/8 bg-[rgba(1,29,64,0.82)] px-6 py-4 backdrop-blur-md md:px-8">
        <div className="flex items-baseline gap-2.5">
          <LogoLink />
          <span className="font-mono text-[10px] tracking-wide text-[#6f80a6]">IEEE · UNINORTE</span>
        </div>
        <nav className="ml-auto flex items-center gap-4 md:gap-6">
          <button
            type="button"
            onClick={() => scrollToId('info')}
            className="hidden cursor-pointer font-mono text-xs tracking-wide text-[#aab6d2] sm:inline"
          >
            INFO
          </button>
          <button
            type="button"
            onClick={() => scrollToId('calendario')}
            className="hidden cursor-pointer font-mono text-xs tracking-wide text-[#aab6d2] sm:inline"
          >
            CALENDARIO
          </button>
          <Link to="/login" className="font-mono text-xs tracking-wide text-white">
            INGRESAR
          </Link>
          <Link
            to="/registro"
            className="accent-gradient rounded-md px-4 py-2.5 font-mono text-xs font-semibold tracking-wide text-navy"
          >
            REGISTRARSE →
          </Link>
        </nav>
      </header>

      <section className="grid-gold relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -right-30 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(250,165,0,0.22),transparent_66%)]" />
        <div className="relative mx-auto max-w-[1180px] px-6 pt-8 pb-20 md:px-8 md:pb-20">
          <div className="mb-14 flex justify-between border-b border-white/10 pb-3.5 font-mono text-[11px] tracking-wide text-[#6f80a6]">
            <span>BARRANQUILLA · COLOMBIA</span>
            <span className="hidden sm:inline">10°59′N · 74°47′W</span>
          </div>

          <div className="flex flex-wrap items-end gap-14">
            <div className="min-w-[320px] flex-1">
              <p className="mb-5 font-mono text-[13px] tracking-[2px] text-gold">
                EVENTO · 30 JUN — 03 JUL · 2026
              </p>
              <h1 className="text-[clamp(56px,9.5vw,118px)] leading-[0.9] font-bold tracking-[-3px] text-white">
                CAMPUS
              </h1>
              <h1 className="text-accent-gradient text-[clamp(56px,9.5vw,118px)] leading-[0.9] font-bold tracking-[-3px]">
                STEM.
              </h1>
              <p className="mt-7 mb-9 max-w-[440px] text-lg leading-relaxed text-[#aab6d2]">
                Cuatro días de talleres, charlas y un hackathon en ciencia, tecnología, ingeniería
                y matemáticas para estudiantes de Barranquilla.
              </p>
              <div className="flex flex-wrap gap-3.5">
                <Link
                  to="/registro"
                  className="accent-gradient rounded-md px-8 py-4 font-mono text-sm font-semibold tracking-wide text-navy"
                >
                  REGISTRARME →
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToId('calendario')}
                  className="rounded-md border border-white/25 px-7 py-4 font-mono text-sm tracking-wide text-white"
                >
                  VER CALENDARIO
                </button>
              </div>
            </div>

            <div className="min-w-[300px] flex-[0_1_380px] rounded-lg border border-gold/35 bg-white/2">
              <div className="border-b border-gold/25 px-5 py-3.5 font-mono text-[11px] tracking-[1.5px] text-gold">
                // FICHA TÉCNICA
              </div>
              <div className="px-5 pt-1.5 pb-4">
                {landingSpecs.map((sp) => (
                  <div
                    key={sp.k}
                    className="flex justify-between gap-4 border-b border-dashed border-white/12 py-3"
                  >
                    <span className="font-mono text-[11px] tracking-wide text-[#6f80a6]">
                      {sp.k}
                    </span>
                    <span className="text-right font-mono text-xs text-[#dce4f3]">{sp.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="accent-gradient">
        <div className="mx-auto grid max-w-[1180px] grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-6 px-6 py-8 md:px-8">
          {landingStats.map((st) => (
            <div key={st.l}>
              <div className="text-[54px] leading-none font-bold tracking-[-2px] text-navy">
                {st.n}
              </div>
              <div className="mt-1.5 font-mono text-xs tracking-wide text-[#7a5a00]">{st.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="info" className="bg-surface scroll-mt-16">
        <div className="mx-auto max-w-[1180px] px-6 py-20 md:px-8 md:py-22">
          <div className="mb-16 flex flex-wrap gap-16">
            <div className="w-[280px] shrink-0">
              <p className="mb-3.5 font-mono text-xs tracking-[1.5px] text-accent">
                [ 00 ] · QUÉ ES
              </p>
              <h2 className="text-[clamp(32px,4vw,46px)] leading-tight font-bold tracking-tight text-navy">
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

          <div className="border-t border-[#d8dce6]">
            {infoCards.map((card) => (
              <div
                key={card.num}
                className="flex flex-wrap items-baseline gap-8 border-b border-[#d8dce6] py-7"
              >
                <div className="w-[90px] shrink-0 text-[46px] leading-none font-bold tracking-[-2px] text-accent">
                  {card.num}
                </div>
                <div className="w-[200px] shrink-0 text-2xl font-semibold text-navy">
                  {card.title}
                </div>
                <p className="min-w-[240px] flex-1 text-base leading-relaxed text-muted">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="calendario" className="grid-navy scroll-mt-16">
        <div className="mx-auto max-w-[1180px] px-6 py-20 md:px-8 md:py-22">
          <div className="mb-11 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 font-mono text-xs tracking-[1.5px] text-gold">[ 01 ] · AGENDA</p>
              <h2 className="text-[clamp(32px,4vw,46px)] font-bold tracking-tight text-white">
                Calendario
              </h2>
            </div>
            <p className="font-mono text-xs tracking-wide text-[#6f80a6]">4 DÍAS · 30 JUN — 03 JUL</p>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-px border border-white/12 bg-white/12">
            {calendarDays.map((day) => (
              <div key={day.idx} className="relative overflow-hidden bg-navy p-6">
                <div className="absolute -top-3.5 right-2 text-[120px] leading-none font-bold text-white/4">
                  {day.idx}
                </div>
                <div className="relative">
                  <div className="text-xl font-bold text-white">{day.label}</div>
                  <div className="mt-1 mb-4 font-mono text-xs text-gold">{day.date}</div>
                  {day.acts.map((act) => (
                    <div
                      key={`${act.time}-${act.name}`}
                      className="flex gap-3 border-t border-white/8 py-2.5"
                    >
                      <span className="min-w-[42px] font-mono text-xs text-accent">{act.time}</span>
                      <span className="text-sm text-[#cdd6e8]">{act.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="accent-gradient">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-8 px-6 py-16 md:px-8">
          <h2 className="text-[clamp(30px,4.5vw,52px)] leading-tight font-bold tracking-tight text-navy">
            ¿Listo para
            <br />
            participar?
          </h2>
          <Link
            to="/registro"
            className="rounded-md bg-navy px-10 py-5 font-mono text-[15px] font-semibold tracking-wide text-white"
          >
            CREAR CUENTA →
          </Link>
        </div>
      </section>

      <footer className="grid-navy text-[#8a98ba]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap justify-between gap-10 px-6 py-14 md:px-8">
          <div>
            <div className="mb-3 text-lg font-bold text-white">Rama IEEE Uninorte</div>
            <p className="max-w-[260px] text-sm leading-relaxed">
              Organizado por la Rama Estudiantil IEEE de la Universidad del Norte, Barranquilla.
            </p>
          </div>
          <div className="flex gap-14">
            <div>
              <div className="mb-3.5 font-mono text-[11px] tracking-wide text-[#5e6f96]">
                ENLACES
              </div>
              <button
                type="button"
                onClick={() => scrollToId('info')}
                className="mb-2.5 block cursor-pointer text-sm"
              >
                Información
              </button>
              <button
                type="button"
                onClick={() => scrollToId('calendario')}
                className="mb-2.5 block cursor-pointer text-sm"
              >
                Calendario
              </button>
              <span className="block text-sm">Contacto</span>
            </div>
            <div>
              <div className="mb-3.5 font-mono text-[11px] tracking-wide text-[#5e6f96]">REDES</div>
              <div className="flex gap-2.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-[34px] w-[34px] rounded-full border border-gold/45"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
