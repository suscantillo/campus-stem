import { useMemo, useState } from 'react'
import { formatGrado, mockStudents } from '../../data/mockAdmin'

export function AdminStudentsPage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return mockStudents
    return mockStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.colegio.toLowerCase().includes(q) ||
        String(s.grado).includes(q) ||
        (s.equipo?.toLowerCase().includes(q) ?? false),
    )
  }, [query])

  function handleExport() {
    const header = 'Nombre,Colegio,Grado,Equipo\n'
    const rows = filtered
      .map(
        (s) =>
          `"${s.name}","${s.colegio}","${formatGrado(s.grado)}","${s.equipo ?? '—'}"`,
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'estudiantes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3.5">
        <label className="flex h-11 min-w-[200px] flex-1 items-center gap-2.5 rounded-md border border-border bg-white px-3.5">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9aa3b8"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          <input
            type="search"
            placeholder="BUSCAR…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full font-mono text-[13px] text-navy outline-none placeholder:text-[#9aa3b8]"
          />
        </label>
        <button
          type="button"
          disabled
          className="flex h-11 cursor-not-allowed items-center rounded-md border border-border bg-white px-4 font-mono text-[13px] text-[#3a4868] opacity-60"
        >
          FILTRAR ▾
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="accent-gradient flex h-11 cursor-pointer items-center px-4 font-mono text-[13px] font-semibold text-navy"
        >
          EXPORTAR
        </button>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#e3e7ef] bg-white">
        <div className="grid grid-cols-[2fr_1.4fr_0.8fr_1.2fr] bg-navy px-4 py-3.5">
          {['NOMBRE', 'COLEGIO', 'GRADO', 'EQUIPO'].map((col) => (
            <span key={col} className="font-mono text-[11px] tracking-wide text-gold">
              {col}
            </span>
          ))}
        </div>
        {filtered.map((s) => (
          <div
            key={s.id}
            className="grid grid-cols-[2fr_1.4fr_0.8fr_1.2fr] items-center border-t border-[#f1f3f7] px-4 py-4"
          >
            <span className="text-sm font-semibold text-navy">{s.name}</span>
            <span className="text-sm text-muted">{s.colegio}</span>
            <span className="font-mono text-[13px] text-muted">{formatGrado(s.grado)}</span>
            <span className="text-sm text-muted">{s.equipo ?? '—'}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted">Sin resultados.</p>
        )}
      </div>
    </>
  )
}
