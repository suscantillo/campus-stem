import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type NotificationType = 'success' | 'error' | 'info'

export interface Notification {
  id: number
  type: NotificationType
  title: string
  message?: string
}

interface NotifyOptions {
  type?: NotificationType
  title: string
  message?: string
  /** Auto-dismiss after this many ms. Pass 0 to keep it until dismissed. */
  duration?: number
}

interface NotificationContextValue {
  notify: (options: NotifyOptions) => void
  dismiss: (id: number) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

const VARIANTS: Record<
  NotificationType,
  { bar: string; iconBg: string; iconColor: string; icon: ReactNode; eyebrow: string }
> = {
  success: {
    bar: '#2f6be0',
    iconBg: '#eef4fd',
    iconColor: '#2f6be0',
    eyebrow: 'Listo',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
  error: {
    bar: '#c0392b',
    iconBg: '#fdecea',
    iconColor: '#c0392b',
    eyebrow: 'Atención',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
    ),
  },
  info: {
    bar: '#5aa9e6',
    iconBg: '#eef4fd',
    iconColor: '#2f6be0',
    eyebrow: 'Aviso',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </svg>
    ),
  },
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Notification[]>([])
  const idRef = useRef(0)
  const timers = useRef<Map<number, number>>(new Map())

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((n) => n.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    ({ type = 'info', title, message, duration = 4500 }: NotifyOptions) => {
      const id = ++idRef.current
      setItems((prev) => [...prev, { id, type, title, message }])
      if (duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), duration)
        timers.current.set(id, timer)
      }
    },
    [dismiss],
  )

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((n) => {
          const v = VARIANTS[n.type]
          return (
            <div
              key={n.id}
              role="status"
              className="pointer-events-auto flex items-start gap-3 overflow-hidden rounded-2xl border border-[#e3ecf7] bg-white py-3.5 pr-3 pl-4 shadow-[0_18px_44px_-22px_rgba(1,40,84,0.55)]"
              style={{ borderLeft: `3px solid ${v.bar}` }}
            >
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: v.iconBg, color: v.iconColor }}
              >
                {v.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-bold tracking-tight text-navy">
                  {n.title}
                </p>
                {n.message && (
                  <p className="mt-0.5 text-[13px] leading-snug text-muted">{n.message}</p>
                )}
              </div>
              <button
                type="button"
                aria-label="Cerrar notificación"
                onClick={() => dismiss(n.id)}
                className="-mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#9aa3b8] transition-colors hover:bg-[#f1f5fb] hover:text-navy"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider')
  return ctx
}
