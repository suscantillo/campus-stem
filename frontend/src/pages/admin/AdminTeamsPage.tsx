import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNotification } from '../../context/NotificationContext'
import { ApiError, mapApiErrorToSpanish } from '../../lib/api'
import { listStudents, type StudentListItem } from '../../lib/adminStudentsApi'
import {
  assignStudentEquipo,
  createTeam,
  deleteTeam,
  generateTeams,
  LEADER_ASSIGNMENT_OPTIONS,
  listTeams,
  updateTeam,
  type LeaderAssignment,
  type TeamListItem,
} from '../../lib/adminTeamsApi'

const DEFAULT_TEAM_SIZE = 4

interface TeamCardProps {
  team: TeamListItem
  allTeams: TeamListItem[]
  busy: boolean
  onRefresh: () => Promise<void>
}

function TeamCard({ team, allTeams, busy, onRefresh }: TeamCardProps) {
  const { notify } = useNotification()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(team.nombre)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    setNameDraft(team.nombre)
  }, [team.nombre])

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setActing(true)
    try {
      await action()
      await onRefresh()
      notify({ type: 'success', title: 'Equipo actualizado', message: successMessage })
    } catch (err) {
      const message =
        err instanceof ApiError
          ? mapApiErrorToSpanish(err.detail, 'No se pudo actualizar el equipo.')
          : 'No se pudo conectar con el servidor.'
      notify({ type: 'error', title: 'Error', message })
    } finally {
      setActing(false)
    }
  }

  async function saveName() {
    const trimmed = nameDraft.trim()
    if (!trimmed || trimmed === team.nombre) {
      setEditingName(false)
      setNameDraft(team.nombre)
      return
    }
    await runAction(
      () => updateTeam(team.id, { nombre: trimmed }),
      `Nombre actualizado a "${trimmed}".`,
    )
    setEditingName(false)
  }

  async function handleSetLeader(memberId: string) {
    await runAction(
      () => updateTeam(team.id, { lider_id: memberId }),
      'Líder actualizado.',
    )
  }

  async function handleRemoveLeader() {
    await runAction(
      () => updateTeam(team.id, { lider_id: null }),
      'Equipo sin líder asignado.',
    )
  }

  async function handleRemoveMember(memberId: string) {
    if (!window.confirm('¿Quitar a este estudiante del equipo?')) return
    await runAction(
      () => assignStudentEquipo(memberId, null),
      'Estudiante removido del equipo.',
    )
  }

  async function handleMoveMember(memberId: string, targetTeamId: string) {
    if (targetTeamId === team.id) return
    const target = allTeams.find((t) => t.id === targetTeamId)
    await runAction(
      () => assignStudentEquipo(memberId, targetTeamId),
      `Estudiante movido a ${target?.nombre ?? 'otro equipo'}.`,
    )
  }

  async function handleDeleteTeam() {
    if (
      !window.confirm(
        `¿Eliminar ${team.nombre}? Los miembros quedarán sin equipo asignado.`,
      )
    ) {
      return
    }
    await runAction(() => deleteTeam(team.id), `${team.nombre} eliminado.`)
  }

  const disabled = busy || acting

  return (
    <div className="rounded-2xl border border-[#e3ecf7] bg-white p-5 shadow-[0_1px_2px_rgba(1,40,84,0.04),0_14px_32px_-26px_rgba(1,40,84,0.3)]">
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                disabled={disabled}
                className="h-9 min-w-0 flex-1 rounded-lg border border-[#cdd9ec] px-2.5 text-sm text-navy outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => void saveName()}
                disabled={disabled}
                className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingName(false)
                  setNameDraft(team.nombre)
                }}
                disabled={disabled}
                className="rounded-lg border border-[#cdd9ec] px-3 py-1.5 text-xs text-muted"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              disabled={disabled}
              className="text-left font-display text-lg font-bold text-navy hover:underline disabled:opacity-60"
              title="Editar nombre"
            >
              {team.nombre}
            </button>
          )}
          {team.lider_nombre ? (
            <p className="mt-1 text-xs text-muted">
              Líder: <span className="font-semibold text-navy">{team.lider_nombre}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted">Sin líder asignado</p>
          )}
        </div>
        <span className="shrink-0 font-display text-xs font-semibold text-[#8a96ad]">
          {team.member_count} miembros
        </span>
      </div>

      <p className="mb-3.5 font-mono text-[11px] text-[#9aa3b8]">{team.colegio_label}</p>

      {team.miembros.length === 0 ? (
        <p className="mb-4 text-sm text-muted">Equipo vacío. Asigna estudiantes desde abajo.</p>
      ) : (
        <ul className="mb-4 space-y-3">
          {team.miembros.map((member) => (
            <li
              key={member.id}
              className="rounded-xl border border-[#eef2f8] bg-[#fafbfd] px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-navy">{member.nombre_completo}</span>
                {member.is_lider ? (
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-navy uppercase">
                    Líder
                  </span>
                ) : null}
                {member.colegio ? (
                  <span className="text-xs text-muted">· {member.colegio}</span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {!member.is_lider ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void handleSetLeader(member.id)}
                    className="rounded-md border border-[#cdd9ec] px-2 py-1 text-[11px] font-semibold text-navy disabled:opacity-60"
                  >
                    Hacer líder
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void handleRemoveLeader()}
                    className="rounded-md border border-[#cdd9ec] px-2 py-1 text-[11px] font-semibold text-muted disabled:opacity-60"
                  >
                    Quitar liderazgo
                  </button>
                )}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => void handleRemoveMember(member.id)}
                  className="rounded-md border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-700 disabled:opacity-60"
                >
                  Quitar
                </button>
                <label className="flex items-center gap-1.5 text-[11px] text-muted">
                  Mover a
                  <select
                    disabled={disabled}
                    defaultValue=""
                    onChange={(e) => {
                      const value = e.target.value
                      if (!value) return
                      void handleMoveMember(member.id, value)
                      e.target.value = ''
                    }}
                    className="rounded-md border border-[#cdd9ec] bg-white px-1.5 py-1 text-[11px] text-navy"
                  >
                    <option value="">—</option>
                    {allTeams
                      .filter((t) => t.id !== team.id)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => void handleDeleteTeam()}
        className="text-xs font-semibold text-red-700 underline disabled:opacity-60"
      >
        Eliminar equipo
      </button>
    </div>
  )
}

export function AdminTeamsPage() {
  const { notify } = useNotification()
  const [teams, setTeams] = useState<TeamListItem[]>([])
  const [unassigned, setUnassigned] = useState<StudentListItem[]>([])
  const [teamSize, setTeamSize] = useState(DEFAULT_TEAM_SIZE)
  const [leaderAssignment, setLeaderAssignment] = useState<LeaderAssignment>('random')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [teamsData, studentsData] = await Promise.all([listTeams(), listStudents()])
      setTeams(teamsData.items)
      setUnassigned(studentsData.items.filter((s) => !s.equipo_id))
    } catch (err) {
      if (err instanceof ApiError) {
        setError(mapApiErrorToSpanish(err.detail, 'No se pudo cargar los equipos.'))
      } else {
        setError('No se pudo conectar con el servidor.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const refresh = useCallback(async () => {
    setBusy(true)
    try {
      await loadAll()
    } finally {
      setBusy(false)
    }
  }, [loadAll])

  const teamOptions = useMemo(
    () => teams.map((t) => ({ id: t.id, nombre: t.nombre })),
    [teams],
  )

  async function handleGenerate() {
    if (teams.length > 0) {
      const confirmed = window.confirm(
        '¿Regenerar equipos? Esto reemplazará la asignación actual.',
      )
      if (!confirmed) return
    }

    setBusy(true)
    setError(null)

    try {
      const data = await generateTeams({ team_size: teamSize, leader_assignment: leaderAssignment })
      setTeams(data.items)
      const studentsData = await listStudents()
      setUnassigned(studentsData.items.filter((s) => !s.equipo_id))
      const summary = `${data.total} equipos creados con ${data.students_assigned} estudiantes asignados.`
      notify({ type: 'success', title: 'Equipos generados', message: summary })
    } catch (err) {
      const detail =
        err instanceof ApiError
          ? mapApiErrorToSpanish(err.detail, 'No se pudieron generar los equipos.')
          : 'No se pudo conectar con el servidor.'
      setError(detail)
      notify({ type: 'error', title: 'No se pudieron generar', message: detail })
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateTeam() {
    setBusy(true)
    try {
      await createTeam({})
      await refresh()
      notify({ type: 'success', title: 'Equipo creado', message: 'Nuevo equipo vacío listo.' })
    } catch (err) {
      const message =
        err instanceof ApiError
          ? mapApiErrorToSpanish(err.detail, 'No se pudo crear el equipo.')
          : 'No se pudo conectar con el servidor.'
      notify({ type: 'error', title: 'Error', message })
    } finally {
      setBusy(false)
    }
  }

  async function handleAssignUnassigned(studentId: string, teamId: string) {
    setBusy(true)
    try {
      await assignStudentEquipo(studentId, teamId)
      await refresh()
      notify({ type: 'success', title: 'Estudiante asignado', message: 'Asignación actualizada.' })
    } catch (err) {
      const message =
        err instanceof ApiError
          ? mapApiErrorToSpanish(err.detail, 'No se pudo asignar al estudiante.')
          : 'No se pudo conectar con el servidor.'
      notify({ type: 'error', title: 'Error', message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mb-6 rounded-2xl border border-[#e3ecf7] bg-white p-5">
        <p className="mb-4 font-display text-base font-bold text-navy">Generación automática</p>
        <div className="flex flex-wrap items-end gap-3.5">
          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[13px] font-semibold text-muted">
              Tamaño del equipo
            </span>
            <input
              type="number"
              min={2}
              max={20}
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              disabled={busy}
              className="h-11 w-24 rounded-xl border border-[#cdd9ec] bg-white px-3 text-sm text-navy outline-none focus:border-accent"
            />
          </label>
          <label className="flex min-w-[220px] flex-col gap-1.5">
            <span className="font-display text-[13px] font-semibold text-muted">
              Asignación de líder
            </span>
            <select
              value={leaderAssignment}
              onChange={(e) => setLeaderAssignment(e.target.value as LeaderAssignment)}
              disabled={busy}
              className="h-11 rounded-xl border border-[#cdd9ec] bg-white px-3 text-sm text-navy outline-none focus:border-accent"
            >
              {LEADER_ASSIGNMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={loading || busy}
            className="accent-gradient cursor-pointer rounded-xl px-[22px] py-3 font-display text-sm font-bold text-white shadow-[0_10px_24px_-14px_rgba(47,107,224,0.8)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Procesando…' : 'Generar equipos'}
          </button>
          <button
            type="button"
            onClick={() => void handleCreateTeam()}
            disabled={loading || busy}
            className="rounded-xl border border-[#cdd9ec] bg-white px-[22px] py-3 font-display text-sm font-semibold text-navy disabled:opacity-60"
          >
            Crear equipo vacío
          </button>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!loading && unassigned.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <p className="mb-3 font-display text-sm font-bold text-navy">
            Sin equipo ({unassigned.length})
          </p>
          <ul className="space-y-2">
            {unassigned.map((student) => (
              <li
                key={student.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2"
              >
                <span className="text-sm text-navy">
                  {student.nombre_completo}
                  {student.colegio ? (
                    <span className="text-muted"> · {student.colegio}</span>
                  ) : null}
                </span>
                {teamOptions.length > 0 ? (
                  <select
                    disabled={busy}
                    defaultValue=""
                    onChange={(e) => {
                      const teamId = e.target.value
                      if (!teamId) return
                      void handleAssignUnassigned(student.id, teamId)
                      e.target.value = ''
                    }}
                    className="rounded-lg border border-[#cdd9ec] bg-white px-2 py-1 text-xs text-navy"
                  >
                    <option value="">Asignar a…</option>
                    {teamOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-muted">Crea un equipo primero</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Cargando equipos…</p>
      ) : teams.length === 0 ? (
        <p className="rounded-2xl border border-[#e3ecf7] bg-white px-4 py-8 text-center text-sm text-muted">
          Aún no hay equipos. Genera la asignación o crea un equipo vacío.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              allTeams={teams}
              busy={busy}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}
    </>
  )
}
