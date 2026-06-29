import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.teams import Equipo
from app.db.models.users import RolUsuario, Usuario
from app.schemas.students import StudentListItem, StudentListResponse


class StudentsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def delete_student(self, student_id: uuid.UUID) -> None:
        result = await self.db.execute(
            select(Usuario).where(
                Usuario.id == student_id,
                Usuario.rol == RolUsuario.ESTUDIANTE,
            )
        )
        student = result.scalar_one_or_none()
        if student is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudiante no encontrado.")

        # Si el estudiante es líder de un equipo, quitar el liderazgo
        if student.equipo_id is not None:
            team_result = await self.db.execute(
                select(Equipo).where(Equipo.lider_id == student_id)
            )
            team = team_result.scalar_one_or_none()
            if team is not None:
                team.lider_id = None

        await self.db.delete(student)
        await self.db.commit()

    async def list_students(self) -> StudentListResponse:
        result = await self.db.execute(
            select(Usuario)
            .where(Usuario.rol == RolUsuario.ESTUDIANTE)
            .options(selectinload(Usuario.equipo))
            .order_by(Usuario.created_at.desc())
        )
        students = result.scalars().all()
        items = [
            StudentListItem(
                id=student.id,
                nombre_completo=student.nombre_completo,
                colegio=student.colegio,
                grado=student.grado,
                email=student.email,
                telefono=student.telefono,
                equipo_id=student.equipo_id,
                equipo_nombre=student.equipo.nombre if student.equipo else None,
                es_lider=(
                    student.equipo is not None and student.equipo.lider_id == student.id
                ),
                created_at=student.created_at,
            )
            for student in students
        ]
        return StudentListResponse(items=items, total=len(items))
