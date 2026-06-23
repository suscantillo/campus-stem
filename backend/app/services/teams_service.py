import secrets
import uuid

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.teams import Equipo
from app.db.models.users import RolUsuario, Usuario
from app.schemas.teams import (
    CreateTeamRequest,
    GenerateTeamsResponse,
    LeaderAssignment,
    TeamListItem,
    TeamListResponse,
    TeamMemberItem,
    UpdateTeamRequest,
)


def _colegio_label(colegios: list[str | None]) -> str:
    unique = {c.strip() for c in colegios if c and c.strip()}
    if not unique:
        return "—"
    if len(unique) == 1:
        return next(iter(unique)).upper()
    return "MIXTO"


def _team_to_item(equipo: Equipo) -> TeamListItem:
    miembros = [
        TeamMemberItem(
            id=m.id,
            nombre_completo=m.nombre_completo,
            colegio=m.colegio,
            is_lider=equipo.lider_id == m.id,
        )
        for m in equipo.miembros
    ]
    lider_nombre = next((m.nombre_completo for m in miembros if m.is_lider), None)
    return TeamListItem(
        id=equipo.id,
        nombre=equipo.nombre,
        colegio_label=_colegio_label([m.colegio for m in equipo.miembros]),
        member_count=len(miembros),
        lider_id=equipo.lider_id,
        lider_nombre=lider_nombre,
        miembros=miembros,
        created_at=equipo.created_at,
    )


class TeamsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _load_team(self, team_id: uuid.UUID) -> Equipo:
        result = await self.db.execute(
            select(Equipo)
            .where(Equipo.id == team_id)
            .options(selectinload(Equipo.miembros))
        )
        equipo = result.scalar_one_or_none()
        if equipo is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        return equipo

    async def _load_student(self, student_id: uuid.UUID) -> Usuario:
        result = await self.db.execute(
            select(Usuario).where(
                Usuario.id == student_id,
                Usuario.rol == RolUsuario.ESTUDIANTE,
            )
        )
        student = result.scalar_one_or_none()
        if student is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        return student

    def _validate_lider_is_member(self, equipo: Equipo, lider_id: uuid.UUID | None) -> None:
        if lider_id is None:
            return
        member_ids = {m.id for m in equipo.miembros}
        if lider_id not in member_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Leader must be a member of the team",
            )

    async def _clear_lider_if_student(self, equipo_id: uuid.UUID | None, student_id: uuid.UUID) -> None:
        if equipo_id is None:
            return
        result = await self.db.execute(select(Equipo).where(Equipo.id == equipo_id))
        equipo = result.scalar_one_or_none()
        if equipo and equipo.lider_id == student_id:
            equipo.lider_id = None

    async def list_teams(self) -> TeamListResponse:
        result = await self.db.execute(
            select(Equipo)
            .options(selectinload(Equipo.miembros))
            .order_by(Equipo.nombre.asc())
        )
        equipos = result.scalars().all()
        items = [_team_to_item(equipo) for equipo in equipos]
        return TeamListResponse(items=items, total=len(items))

    async def create_team(self, data: CreateTeamRequest) -> TeamListItem:
        if data.nombre:
            nombre = data.nombre.strip()
        else:
            count_result = await self.db.execute(select(func.count()).select_from(Equipo))
            count = count_result.scalar_one()
            nombre = f"Equipo {count + 1}"

        equipo = Equipo(nombre=nombre)
        self.db.add(equipo)
        await self.db.commit()
        await self.db.refresh(equipo, attribute_names=["miembros", "created_at", "lider_id"])
        return _team_to_item(equipo)

    async def update_team(self, team_id: uuid.UUID, data: UpdateTeamRequest) -> TeamListItem:
        equipo = await self._load_team(team_id)
        fields = data.model_dump(exclude_unset=True)

        if "nombre" in fields and fields["nombre"] is not None:
            equipo.nombre = fields["nombre"].strip()

        if "lider_id" in fields:
            self._validate_lider_is_member(equipo, fields["lider_id"])
            equipo.lider_id = fields["lider_id"]

        await self.db.commit()
        await self.db.refresh(equipo, attribute_names=["miembros", "created_at", "lider_id"])
        return _team_to_item(equipo)

    async def delete_team(self, team_id: uuid.UUID) -> None:
        equipo = await self._load_team(team_id)
        await self.db.delete(equipo)
        await self.db.commit()

    async def assign_student_equipo(
        self,
        student_id: uuid.UUID,
        equipo_id: uuid.UUID | None,
    ) -> None:
        student = await self._load_student(student_id)
        previous_team_id = student.equipo_id

        if equipo_id is not None:
            await self._load_team(equipo_id)
            if student.equipo_id == equipo_id:
                return

        await self._clear_lider_if_student(previous_team_id, student.id)
        student.equipo_id = equipo_id
        await self.db.commit()

    async def generate_teams(
        self,
        team_size: int,
        leader_assignment: LeaderAssignment,
    ) -> GenerateTeamsResponse:
        result = await self.db.execute(
            select(Usuario).where(Usuario.rol == RolUsuario.ESTUDIANTE)
        )
        students = list(result.scalars().all())

        if not students:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No students to assign to teams",
            )

        await self.db.execute(delete(Equipo))
        await self.db.flush()

        rng = secrets.SystemRandom()
        rng.shuffle(students)

        equipos: list[Equipo] = []
        team_num = 1
        for index in range(0, len(students), team_size):
            chunk = students[index : index + team_size]
            equipo = Equipo(nombre=f"Equipo {team_num}")
            self.db.add(equipo)
            await self.db.flush()
            for student in chunk:
                student.equipo_id = equipo.id

            if leader_assignment == LeaderAssignment.FIRST and chunk:
                equipo.lider_id = chunk[0].id
            elif leader_assignment == LeaderAssignment.RANDOM and chunk:
                equipo.lider_id = rng.choice(chunk).id

            equipos.append(equipo)
            team_num += 1

        await self.db.commit()

        result = await self.db.execute(
            select(Equipo)
            .where(Equipo.id.in_([e.id for e in equipos]))
            .options(selectinload(Equipo.miembros))
            .order_by(Equipo.nombre.asc())
        )
        created = result.scalars().all()
        items = [_team_to_item(equipo) for equipo in created]

        return GenerateTeamsResponse(
            items=items,
            total=len(items),
            students_assigned=len(students),
        )
