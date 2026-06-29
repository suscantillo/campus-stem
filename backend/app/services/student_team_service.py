from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.teams import Equipo
from app.db.models.users import RolUsuario, Usuario
from app.schemas.student_team import MiembroEquipoResponse, MiEquipoStudentResponse, RenombrarEquipoRequest


class StudentTeamService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_mi_equipo(self, usuario: Usuario) -> MiEquipoStudentResponse:
        if usuario.equipo_id is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sin equipo asignado.")

        result = await self.db.execute(
            select(Equipo)
            .options(selectinload(Equipo.miembros))
            .where(Equipo.id == usuario.equipo_id)
        )
        equipo = result.scalar_one_or_none()
        if equipo is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado.")

        es_lider = equipo.lider_id == usuario.id
        miembros = [
            MiembroEquipoResponse(
                id=m.id,
                nombre_completo=m.nombre_completo,
                colegio=m.colegio,
                grado=m.grado,
                es_lider=(equipo.lider_id == m.id),
            )
            for m in equipo.miembros
        ]

        return MiEquipoStudentResponse(
            equipo_id=equipo.id,
            equipo_nombre=equipo.nombre,
            nombre_confirmado=equipo.nombre_confirmado,
            presupuesto=equipo.presupuesto,
            es_lider=es_lider,
            miembros=miembros,
        )

    async def renombrar_equipo(self, usuario: Usuario, data: RenombrarEquipoRequest) -> MiEquipoStudentResponse:
        if usuario.equipo_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sin equipo asignado.")

        result = await self.db.execute(
            select(Equipo)
            .options(selectinload(Equipo.miembros))
            .where(Equipo.id == usuario.equipo_id)
        )
        equipo = result.scalar_one_or_none()
        if equipo is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado.")

        if equipo.lider_id != usuario.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo el líder puede renombrar el equipo.")

        equipo.nombre = data.nombre
        equipo.nombre_confirmado = True
        await self.db.commit()
        await self.db.refresh(equipo)

        es_lider = True
        miembros = [
            MiembroEquipoResponse(
                id=m.id,
                nombre_completo=m.nombre_completo,
                colegio=m.colegio,
                grado=m.grado,
                es_lider=(equipo.lider_id == m.id),
            )
            for m in equipo.miembros
        ]

        return MiEquipoStudentResponse(
            equipo_id=equipo.id,
            equipo_nombre=equipo.nombre,
            nombre_confirmado=equipo.nombre_confirmado,
            presupuesto=equipo.presupuesto,
            es_lider=es_lider,
            miembros=miembros,
        )
