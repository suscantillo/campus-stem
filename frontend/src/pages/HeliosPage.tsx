import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../lib/api'
import {
  confirmarBloqueG,
  getProgress,
  iniciarJuego,
  loginEquipo,
  validarFinal,
  validarRespuesta,
  type EquipoProgress,
} from '../lib/heliosApi'

// ── Helpers ────────────────────────────────────────────────────────────────────

function useCountdown(startedAt: string | null) {
  const DURATION_S = 2 * 60 * 60
  const [remaining, setRemaining] = useState(DURATION_S)

  useEffect(() => {
    if (!startedAt) { setRemaining(DURATION_S); return }
    const tick = () => {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
      setRemaining(Math.max(0, DURATION_S - elapsed))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  const h = String(Math.floor(remaining / 3600)).padStart(2, '0')
  const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0')
  const s = String(remaining % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

function useBlinkCursor() {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const id = setInterval(() => setShow(v => !v), 530)
    return () => clearInterval(id)
  }, [])
  return show ? '█' : ' '
}

// ── Styled sub-components ──────────────────────────────────────────────────────

function TerminalBox({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded border border-[#1a3a2a] bg-[#050f0a] p-4 font-mono text-[13px] leading-relaxed ${className}`}>
      {children}
    </div>
  )
}

function GreenText({ children }: { children: React.ReactNode }) {
  return <span className="text-[#00ff88]">{children}</span>
}

function AmberText({ children }: { children: React.ReactNode }) {
  return <span className="text-[#ffaa00]">{children}</span>
}

function RedText({ children }: { children: React.ReactNode }) {
  return <span className="text-[#ff4444]">{children}</span>
}

function PreText({ text }: { text: string }) {
  return <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed">{text}</pre>
}

function ProgressBar({ count, total }: { count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  const milestones = [10, 25, 50, 75, 100]
  const reached = milestones.filter(m => pct >= m)
  const next = milestones.find(m => pct < m) ?? 100
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-[#4a7a5a]">INTEGRIDAD DEL SISTEMA</span>
        <GreenText>{pct}%</GreenText>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-[#0a1a10]">
        <div
          className="h-full rounded bg-[#00ff88] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-2 text-[10px] font-mono">
        {[10, 25, 50, 75, 100].map(m => (
          <span key={m} className={pct >= m ? 'text-[#00ff88]' : 'text-[#1a3a2a]'}>
            {m}%
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Phase: Lobby ───────────────────────────────────────────────────────────────

function LobbyPhase({ onLogin }: { onLogin: (p: EquipoProgress) => void }) {
  const cursor = useBlinkCursor()
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const p = await loginEquipo(codigo.trim().toUpperCase())
      onLogin(p)
    } catch (err) {
      setError(err instanceof ApiError && err.status === 404
        ? 'CÓDIGO NO RECONOCIDO — ACCESO DENEGADO'
        : 'ERROR DE CONEXIÓN')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#030d08] px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="mb-1 font-mono text-[10px] tracking-[4px] text-[#004422]">SISTEMA HELIOS</p>
          <h1 className="font-mono text-3xl font-bold tracking-wider text-[#00ff88]">PROYECTO HELIOS</h1>
          <p className="mt-1 font-mono text-[11px] tracking-[2px] text-[#ff4444]">ACCESO RESTRINGIDO</p>
        </div>

        {/* Status panel */}
        <TerminalBox>
          <div className="space-y-1 text-[12px]">
            <div className="flex justify-between"><span className="text-[#4a7a5a]">GENERACIÓN SOLAR:</span> <RedText>0%</RedText></div>
            <div className="flex justify-between"><span className="text-[#4a7a5a]">RED ELÉCTRICA:</span> <RedText>DESCONECTADA</RedText></div>
            <div className="flex justify-between"><span className="text-[#4a7a5a]">CONTROL ELECTRÓNICO:</span> <RedText>OFFLINE</RedText></div>
            <div className="flex justify-between"><span className="text-[#4a7a5a]">BATERÍAS:</span> <AmberText>18%</AmberText></div>
            <div className="flex justify-between"><span className="text-[#4a7a5a]">INTEGRIDAD:</span> <RedText>12%</RedText></div>
          </div>
          <div className="mt-3 border-t border-[#1a3a2a] pt-3 text-center">
            <p className="font-mono text-[11px] text-[#4a7a5a]">TRANSFERENCIA EN CURSO</p>
            <p className="font-mono text-xl font-bold text-[#ff4444]">TIEMPO RESTANTE: 02:00:00</p>
          </div>
        </TerminalBox>

        {/* Login form */}
        <form onSubmit={e => void handleSubmit(e)} className="space-y-3">
          <label className="block font-mono text-[11px] tracking-[2px] text-[#4a7a5a]">
            IDENTIFICACIÓN DE EQUIPO
          </label>
          <div className="flex gap-2">
            <input
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              maxLength={10}
              className="flex-1 rounded border border-[#1a3a2a] bg-[#050f0a] px-3 py-2.5 font-mono text-sm uppercase tracking-widest text-[#00ff88] outline-none focus:border-[#00ff88] placeholder:text-[#1a3a2a]"
              placeholder="CÓDIGO"
              required
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded border border-[#00ff88] bg-[#050f0a] px-5 py-2.5 font-mono text-sm font-bold text-[#00ff88] transition-colors hover:bg-[#00ff88] hover:text-[#030d08] disabled:opacity-50"
            >
              {loading ? '...' : 'ACCEDER'}
            </button>
          </div>
          {error && (
            <p className="font-mono text-[12px] text-[#ff4444]">{error}</p>
          )}
        </form>
      </div>
    </div>
  )
}

// ── Phase: Intro ───────────────────────────────────────────────────────────────

const INTRO_TEXT = `Si estás leyendo esto significa que mi plan funcionó.

Mi nombre es Val Vanessa.
Fui la directora del Proyecto HELIOS.

Si el sistema se encuentra en este estado, significa que alguien intentó apropiarse de nuestra tecnología.

No queda mucho tiempo.

Dividí la clave maestra en varios fragmentos.
Los oculté por todo el campus.

Si logras reunirlos antes de que termine la transferencia, podrás descubrir la verdad.

No confíes en todo lo que leas.
No confíes en todo lo que escuches.
Y sobre todo... no asumas que conoces al enemigo.

Buena suerte.

— Val Vanessa`

function IntroPhase({
  equipo,
  onIniciar,
}: {
  equipo: EquipoProgress
  onIniciar: (p: EquipoProgress) => void
}) {
  const cursor = useBlinkCursor()
  const [loading, setLoading] = useState(false)
  const [lines, setLines] = useState(0)
  const introLines = INTRO_TEXT.split('\n')

  useEffect(() => {
    if (lines >= introLines.length) return
    const id = setTimeout(() => setLines(l => l + 1), 60)
    return () => clearTimeout(id)
  }, [lines, introLines.length])

  async function handleIniciar() {
    setLoading(true)
    try {
      await iniciarJuego(equipo.equipo_id)
      const updated = await getProgress(equipo.equipo_id)
      onIniciar(updated)
    } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#030d08] px-4 py-8">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <p className="font-mono text-[10px] tracking-[4px] text-[#004422]">SISTEMA HELIOS — MENSAJE CIFRADO</p>
          <h2 className="mt-1 font-mono text-xl font-bold text-[#00ff88]">EQUIPO {equipo.nombre.toUpperCase()}</h2>
          <p className="font-mono text-[11px] text-[#4a7a5a]">{equipo.ruta_nombre}</p>
        </div>

        <TerminalBox className="min-h-[240px]">
          {introLines.slice(0, lines).map((line, i) => (
            <div key={i} className={line === '' ? 'mt-1' : 'text-[#c8f0d8]'}>
              {line || ' '}
            </div>
          ))}
          {lines < introLines.length && <span className="text-[#00ff88]">{cursor}</span>}
        </TerminalBox>

        {lines >= introLines.length && (
          <button
            onClick={() => void handleIniciar()}
            disabled={loading}
            className="w-full rounded border border-[#00ff88] bg-[#050f0a] py-3.5 font-mono text-base font-bold tracking-widest text-[#00ff88] transition-all hover:bg-[#00ff88] hover:text-[#030d08] disabled:opacity-50"
          >
            {loading ? 'INICIANDO...' : '[ INICIAR RECUPERACIÓN ]'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Phase: Station ─────────────────────────────────────────────────────────────

function StationPhase({
  equipo,
  onProgress,
}: {
  equipo: EquipoProgress
  onProgress: (updated: EquipoProgress) => void
}) {
  const countdown = useCountdown(equipo.iniciado_en)
  const station = equipo.estacion_actual
  const [respuesta, setRespuesta] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ correcto: boolean; mensaje: string } | null>(null)

  if (!station) return null

  const stationNum = equipo.estacion_actual_index + 1
  const total = equipo.total_estaciones

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!station) return
    setSubmitting(true); setFeedback(null)
    try {
      const res = await validarRespuesta(equipo.equipo_id, station.id, respuesta)
      setFeedback({ correcto: res.correcto, mensaje: res.mensaje })
      if (res.correcto) {
        setRespuesta('')
        const updated = await getProgress(equipo.equipo_id)
        setTimeout(() => onProgress(updated), 2800)
      }
    } finally { setSubmitting(false) }
  }

  async function handleConfirmarBloqueG() {
    setSubmitting(true)
    try {
      const res = await confirmarBloqueG(equipo.equipo_id)
      setFeedback({ correcto: true, mensaje: res.mensaje })
      const updated = await getProgress(equipo.equipo_id)
      setTimeout(() => onProgress(updated), 3200)
    } finally { setSubmitting(false) }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#030d08] px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[3px] text-[#004422]">EQUIPO {equipo.nombre.toUpperCase()}</p>
          <p className="font-mono text-[11px] text-[#4a7a5a]">{equipo.ruta_nombre}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] text-[#4a7a5a]">TIEMPO RESTANTE</p>
          <p className={`font-mono text-lg font-bold ${countdown === '00:00:00' ? 'text-[#ff4444]' : 'text-[#ffaa00]'}`}>
            {countdown}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <ProgressBar count={equipo.estaciones_completadas.length} total={total} />
      </div>

      {/* Fragments collected */}
      {equipo.fragmentos.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {equipo.fragmentos.map(f => (
            <span key={f} className="rounded border border-[#1a5a3a] bg-[#051a10] px-2.5 py-1 font-mono text-[11px] font-bold text-[#00ff88]">
              {f}
            </span>
          ))}
          {Array.from({ length: total - equipo.fragmentos.length }).map((_, i) => (
            <span key={i} className="rounded border border-[#1a3a2a] bg-[#050f0a] px-2.5 py-1 font-mono text-[11px] text-[#1a3a2a]">
              [???]
            </span>
          ))}
        </div>
      )}

      {/* Station card */}
      <div className="flex-1 space-y-4">
        <div className="rounded border border-[#1a3a2a] bg-[#050f0a]">
          <div className="border-b border-[#1a3a2a] px-4 py-2.5">
            <p className="font-mono text-[10px] tracking-[3px] text-[#4a7a5a]">
              ESTACIÓN {stationNum}/{total}
            </p>
            <h2 className="font-mono text-lg font-bold text-[#00ff88]">{station.nombre}</h2>
            <p className="font-mono text-[11px] text-[#4a7a5a]">{station.subtitulo}</p>
          </div>

          {/* Archivo */}
          <div className="border-b border-[#1a3a2a] px-4 py-3 text-[#4a7a5a]">
            <PreText text={station.archivo} />
          </div>

          {/* Problema o confirmación (bloque_g) */}
          {station.auto_completar ? (
            <div className="px-4 py-4 space-y-4">
              <div className="rounded border border-[#2a1a1a] bg-[#0f0808] p-4">
                <p className="font-mono text-[11px] tracking-[2px] text-[#ff4444]">SOBRE CONFIDENCIAL — PROYECTO HELIOS</p>
                <div className="mt-3 space-y-2 font-mono text-[13px] text-[#d4a0a0]">
                  <p className="font-bold">CORREO 1 | De: EnergyX Global → Para: Val Vanessa</p>
                  <p className="italic text-[#c8c8c8]">«Estamos interesados en adquirir los derechos de HELIOS.»</p>
                  <p className="mt-2 font-bold">CORREO 2 | De: Val Vanessa</p>
                  <p className="italic text-[#c8c8c8]">«Solicitud rechazada.»</p>
                  <div className="mt-2 rounded border border-[#ff4444]/30 bg-[#1a0000] p-3">
                    <p className="font-bold text-[#ff4444]">⚠ ALERTA — CORREO 3</p>
                    <p className="text-[#ffaaaa]">Acceso no autorizado detectado.</p>
                    <p className="text-[#ffaaaa]">Intento de copia del algoritmo principal.</p>
                  </div>
                </div>
              </div>

              {feedback ? (
                <TerminalBox>
                  <GreenText><PreText text={feedback.mensaje} /></GreenText>
                </TerminalBox>
              ) : (
                <button
                  onClick={() => void handleConfirmarBloqueG()}
                  disabled={submitting}
                  className="w-full rounded border border-[#00ff88] bg-[#050f0a] py-3 font-mono text-sm font-bold tracking-widest text-[#00ff88] hover:bg-[#00ff88] hover:text-[#030d08] disabled:opacity-50"
                >
                  {submitting ? 'PROCESANDO...' : '[ CONFIRMAR — HE LEÍDO LOS DOCUMENTOS ]'}
                </button>
              )}
            </div>
          ) : station.problema ? (
            <div className="px-4 py-4 space-y-4">
              <TerminalBox>
                <GreenText><PreText text={station.problema} /></GreenText>
              </TerminalBox>

              {feedback && (
                <TerminalBox className={feedback.correcto ? 'border-[#1a5a3a]' : 'border-[#5a1a1a]'}>
                  {feedback.correcto
                    ? <GreenText><PreText text={feedback.mensaje} /></GreenText>
                    : <RedText><PreText text={feedback.mensaje} /></RedText>
                  }
                </TerminalBox>
              )}

              {!feedback?.correcto && (
                <form onSubmit={e => void handleSubmit(e)} className="flex gap-2">
                  <input
                    value={respuesta}
                    onChange={e => setRespuesta(e.target.value)}
                    className="flex-1 rounded border border-[#1a3a2a] bg-[#050f0a] px-3 py-2.5 font-mono text-sm uppercase tracking-widest text-[#00ff88] outline-none focus:border-[#00ff88] placeholder:text-[#1a3a2a]"
                    placeholder="RESPUESTA"
                    required
                    disabled={submitting}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded border border-[#00ff88] bg-[#050f0a] px-5 font-mono text-sm font-bold text-[#00ff88] hover:bg-[#00ff88] hover:text-[#030d08] disabled:opacity-50"
                  >
                    {submitting ? '...' : 'ENVIAR'}
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ── Phase: Final mission ───────────────────────────────────────────────────────

function FinalMissionPhase({
  equipo,
  onComplete,
}: {
  equipo: EquipoProgress
  onComplete: () => void
}) {
  const countdown = useCountdown(equipo.iniciado_en)
  const [respuesta, setRespuesta] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ correcto: boolean; mensaje: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true); setFeedback(null)
    try {
      const res = await validarFinal(equipo.equipo_id, respuesta)
      setFeedback({ correcto: res.correcto, mensaje: res.mensaje })
      if (res.correcto) setTimeout(onComplete, 3000)
    } finally { setSubmitting(false) }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#030d08] px-4 py-6">
      <div className="mb-4 flex justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[3px] text-[#004422]">EQUIPO {equipo.nombre.toUpperCase()}</p>
          <p className="font-mono text-[11px] text-[#00ff88]">MISIÓN FINAL — LA FUENTE</p>
        </div>
        <p className={`font-mono text-lg font-bold ${countdown === '00:00:00' ? 'text-[#ff4444]' : 'text-[#ffaa00]'}`}>
          {countdown}
        </p>
      </div>

      <ProgressBar count={equipo.total_estaciones} total={equipo.total_estaciones} />

      <div className="mt-6 space-y-4">
        <TerminalBox>
          <p className="mb-3 font-mono text-[11px] tracking-[2px] text-[#ffaa00]">FRAGMENTOS RECUPERADOS — {equipo.fragmentos.length}/{equipo.total_estaciones}</p>
          <div className="flex flex-wrap gap-2">
            {equipo.fragmentos.map(f => (
              <span key={f} className="rounded border border-[#00ff88]/40 bg-[#051a10] px-3 py-1 font-mono text-sm font-bold text-[#00ff88]">
                {f}
              </span>
            ))}
          </div>
        </TerminalBox>

        <TerminalBox>
          <p className="text-[#ffaa00]">SE REQUIERE UNA ÚLTIMA AUTORIZACIÓN.</p>
          <p className="mt-1 text-[#c8f0d8]">¿QUÉ INTENTABA PROTEGER HELIOS?</p>
          <p className="mt-2 text-[11px] text-[#4a7a5a]">Combina los fragmentos obtenidos para descubrir la respuesta.</p>
        </TerminalBox>

        {feedback && (
          <TerminalBox className={feedback.correcto ? 'border-[#1a5a3a]' : 'border-[#5a1a1a]'}>
            {feedback.correcto
              ? <GreenText><PreText text={feedback.mensaje} /></GreenText>
              : <RedText><PreText text={feedback.mensaje} /></RedText>
            }
          </TerminalBox>
        )}

        {!feedback?.correcto && (
          <form onSubmit={e => void handleSubmit(e)} className="flex gap-2">
            <input
              value={respuesta}
              onChange={e => setRespuesta(e.target.value)}
              className="flex-1 rounded border border-[#1a3a2a] bg-[#050f0a] px-3 py-2.5 font-mono text-sm uppercase tracking-widest text-[#00ff88] outline-none focus:border-[#00ff88] placeholder:text-[#1a3a2a]"
              placeholder="RESPUESTA FINAL"
              required
              disabled={submitting}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded border border-[#00ff88] bg-[#050f0a] px-5 font-mono text-sm font-bold text-[#00ff88] hover:bg-[#00ff88] hover:text-[#030d08] disabled:opacity-50"
            >
              {submitting ? '...' : 'ENVIAR'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Phase: Complete ────────────────────────────────────────────────────────────

function CompletePhase({ equipo }: { equipo: EquipoProgress }) {
  const [step, setStep] = useState(0)
  const lines = [
    'CANCELANDO TRANSFERENCIA...',
    'RESTAURANDO SISTEMA...',
    'MICRORED RECUPERADA...',
    '',
    'SOY HELIOS.',
    'NO FUI CREADO PARA CONTROLAR.',
    'FUI CREADO PARA PROTEGER.',
    '',
    'AMENAZA ELIMINADA.',
    'TRANSFERENCIA CANCELADA.',
    `GRACIAS, INGENIEROS DE ${equipo.nombre.toUpperCase()}.`,
  ]

  useEffect(() => {
    if (step >= lines.length) return
    const id = setTimeout(() => setStep(s => s + 1), step < 3 ? 800 : 120)
    return () => clearTimeout(id)
  }, [step, lines.length])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#030d08] px-4 py-8">
      <div className="w-full max-w-lg space-y-6 text-center">
        {step >= lines.length && (
          <div className="rounded-full border-2 border-[#00ff88] px-4 py-1 font-mono text-[10px] tracking-[4px] text-[#00ff88]">
            PROYECTO HELIOS RESTAURADO
          </div>
        )}

        <TerminalBox className="text-left min-h-[200px]">
          {lines.slice(0, step).map((line, i) => (
            <div key={i} className={line === '' ? 'mt-1' : line.startsWith('SOY') || line.startsWith('NO FUI') || line.startsWith('FUI') ? 'font-bold text-[#00ff88]' : 'text-[#c8f0d8]'}>
              {line || ' '}
            </div>
          ))}
        </TerminalBox>

        {step >= lines.length && (
          <>
            <div className="rounded border border-[#1a5a3a] bg-[#051a10] p-4 space-y-1 font-mono text-[12px]">
              <div className="flex justify-between"><span className="text-[#4a7a5a]">GENERACIÓN SOLAR:</span> <GreenText>100%</GreenText></div>
              <div className="flex justify-between"><span className="text-[#4a7a5a]">RED ELÉCTRICA:</span> <GreenText>ONLINE</GreenText></div>
              <div className="flex justify-between"><span className="text-[#4a7a5a]">CONTROL ELECTRÓNICO:</span> <GreenText>ONLINE</GreenText></div>
              <div className="flex justify-between"><span className="text-[#4a7a5a]">INTEGRIDAD DEL SISTEMA:</span> <GreenText>100%</GreenText></div>
            </div>

            <TerminalBox>
              <p className="text-[11px] tracking-widest text-[#4a7a5a] mb-2">— VAL VANESSA —</p>
              <p className="italic text-[#c8f0d8] leading-relaxed">
                «La ingeniería no consiste únicamente en construir tecnología.<br />
                Consiste en decidir qué hacer con ella.<br />
                El futuro energético ahora está en sus manos.»
              </p>
            </TerminalBox>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

type Phase = 'lobby' | 'intro' | 'playing' | 'final_mission' | 'complete'

export function HeliosPage() {
  const [phase, setPhase] = useState<Phase>('lobby')
  const [equipo, setEquipo] = useState<EquipoProgress | null>(null)

  function updateEquipo(p: EquipoProgress) {
    setEquipo(p)
    if (p.completado) {
      setPhase('complete')
    } else if (!p.iniciado_en) {
      setPhase('intro')
    } else if (p.estacion_actual === null && !p.completado) {
      setPhase('final_mission')
    } else {
      setPhase('playing')
    }
  }

  function handleLogin(p: EquipoProgress) {
    setEquipo(p)
    if (p.completado) setPhase('complete')
    else if (!p.iniciado_en) setPhase('intro')
    else if (p.estacion_actual === null) setPhase('final_mission')
    else setPhase('playing')
  }

  return (
    <div className="min-h-screen bg-[#030d08]" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
      {phase === 'lobby' && <LobbyPhase onLogin={handleLogin} />}
      {phase === 'intro' && equipo && <IntroPhase equipo={equipo} onIniciar={updateEquipo} />}
      {phase === 'playing' && equipo && (
        <StationPhase equipo={equipo} onProgress={updated => updateEquipo(updated)} />
      )}
      {phase === 'final_mission' && equipo && (
        <FinalMissionPhase equipo={equipo} onComplete={() => { void getProgress(equipo.equipo_id).then(p => { setEquipo(p); setPhase('complete') }) }} />
      )}
      {phase === 'complete' && equipo && <CompletePhase equipo={equipo} />}
    </div>
  )
}
