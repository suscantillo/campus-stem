import { useCallback, useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { ApiError, mapApiErrorToSpanish } from '../../lib/api'
import {
  formatGrado,
  listStudents,
  type StudentListItem,
} from '../../lib/adminStudentsApi'

export function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listStudents()
      setStudents(data.items)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(mapApiErrorToSpanish(err.detail, 'No se pudo cargar el listado.'))
      } else {
        setError('No se pudo conectar con el servidor.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStudents()
  }, [loadStudents])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        s.nombre_completo.toLowerCase().includes(q) ||
        (s.colegio?.toLowerCase().includes(q) ?? false) ||
        s.email.toLowerCase().includes(q) ||
        (s.telefono?.includes(q) ?? false) ||
        (s.equipo_nombre?.toLowerCase().includes(q) ?? false) ||
        String(s.grado ?? '').includes(q),
    )
  }, [query, students])

  function handleExport() {
    const rows = filtered.map((s) => ({
      Nombre: s.nombre_completo,
      Colegio: s.colegio ?? '',
      Grado: formatGrado(s.grado),
      Email: s.email,
      Teléfono: s.telefono ?? '',
      Equipo: s.equipo_nombre ?? '',
      Líder: s.es_lider ? 'Sí' : '',
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes')
    XLSX.writeFile(workbook, 'estudiantes.xlsx')
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3.5">
        <label className="flex h-11 min-w-[200px] flex-1 items-center gap-2.5 rounded-xl border border-[#cdd9ec] bg-white px-3.5">
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
            placeholder="Buscar estudiante…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm text-navy outline-none placeholder:text-[#9aa3b8]"
          />
        </label>
        <button
          type="button"
          onClick={() => void loadStudents()}
          disabled={loading}
          className="flex h-11 items-center rounded-xl border border-[#cdd9ec] bg-white px-4 font-display text-sm font-semibold text-[#3a4868] disabled:opacity-60"
        >
          {loading ? 'Actualizando…' : 'Actualizar'}
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={loading || filtered.length === 0}
          className="accent-gradient flex h-11 cursor-pointer items-center rounded-xl px-5 font-display text-sm font-bold text-white shadow-[0_10px_24px_-14px_rgba(47,107,224,0.8)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Exportar
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#e3ecf7] bg-white">
        <div className="grid grid-cols-[2fr_1.4fr_0.7fr_1.2fr_0.6fr_1.6fr_1fr] bg-navy px-4 py-3.5">
          {['Nombre', 'Colegio', 'Grado', 'Equipo', 'Líder', 'Email', 'Teléfono'].map((col) => (
            <span key={col} className="font-display text-[13px] font-semibold text-[#5aa9e6]">
              {col}
            </span>
          ))}
        </div>
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-muted">Cargando estudiantes…</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">
            {students.length === 0
              ? 'Aún no hay estudiantes registrados.'
              : 'Sin resultados para la búsqueda.'}
          </p>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-[2fr_1.4fr_0.7fr_1.2fr_0.6fr_1.6fr_1fr] items-center border-t border-[#f1f3f7] px-4 py-4"
            >
              <span className="text-sm font-semibold text-navy">{s.nombre_completo}</span>
              <span className="text-sm text-muted">{s.colegio ?? '—'}</span>
              <span className="font-mono text-[13px] text-muted">{formatGrado(s.grado)}</span>
              <span className="text-sm text-muted">{s.equipo_nombre ?? '—'}</span>
              <span className="text-sm text-muted">{s.es_lider ? 'Sí' : '—'}</span>
              <span className="truncate text-sm text-muted">{s.email}</span>
              <span className="font-mono text-[13px] text-muted">{s.telefono ?? '—'}</span>
            </div>
          ))
        )}
      </div>

      {!loading && students.length > 0 ? (
        <p className="mt-3 font-mono text-[11px] text-muted">
          {filtered.length} de {students.length} estudiantes
        </p>
      ) : null}
    </>
  )
}
