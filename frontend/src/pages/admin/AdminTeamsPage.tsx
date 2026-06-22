import { useState } from 'react'
import { mockTeams } from '../../data/mockAdmin'

export function AdminTeamsPage() {
  const [teams, setTeams] = useState(mockTeams)
  const [message, setMessage] = useState<string | null>(null)

  function handleGenerate() {
    if (teams.length > 0 && !window.confirm('¿Regenerar equipos? Esto reemplazará la asignación actual (demo).')) {
      return
    }
    setTeams(mockTeams)
    setMessage('Equipos generados (demo). Conecta el backend para la asignación real.')
    setTimeout(() => setMessage(null), 4000)
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={handleGenerate}
          className="accent-gradient cursor-pointer rounded-md px-5 py-3 font-mono text-[13px] font-semibold text-navy"
        >
          GENERAR EQUIPOS
        </button>
      </div>

      {message && (
        <p className="mb-4 rounded-md border border-accent/30 bg-white px-4 py-3 text-sm text-navy">
          {message}
        </p>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
        {teams.map((team) => (
          <div key={team.id} className="rounded-[10px] border border-[#e3e7ef] bg-white p-5">
            <div className="mb-3.5 flex items-baseline justify-between">
              <span className="text-lg font-bold text-navy">{team.name}</span>
              <span className="font-mono text-[11px] text-[#8a96ad]">{team.members} MIEMBROS</span>
            </div>
            <p className="mb-3.5 font-mono text-[11px] text-[#9aa3b8]">{team.colegio}</p>
            <div className="flex gap-1.5">
              {Array.from({ length: team.members }).map((_, i) => (
                <div key={i} className="h-[30px] w-[30px] rounded-full bg-[#eef0f4]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
