from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.models.users import RolUsuario, Usuario
from app.db.session import get_db
from app.schemas.students import StudentListResponse
from app.schemas.teams import AssignStudentEquipoRequest
from app.services.students_service import StudentsService
from app.services.teams_service import TeamsService

router = APIRouter(prefix="/admin/students")


@router.get("", response_model=StudentListResponse)
async def list_students(
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    service = StudentsService(db)
    return await service.list_students()


@router.patch("/{student_id}/equipo", status_code=status.HTTP_204_NO_CONTENT)
async def assign_student_equipo(
    student_id: UUID,
    data: AssignStudentEquipoRequest,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    service = TeamsService(db)
    await service.assign_student_equipo(student_id, data.equipo_id)
