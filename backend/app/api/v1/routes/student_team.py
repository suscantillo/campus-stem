from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.permissions import require_roles
from app.db.models.users import RolUsuario, Usuario
from app.db.session import get_db
from app.schemas.student_team import MiEquipoStudentResponse, RenombrarEquipoRequest
from app.services.student_team_service import StudentTeamService

router = APIRouter(prefix="/me")


@router.get("/equipo", response_model=MiEquipoStudentResponse)
async def get_mi_equipo(
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ESTUDIANTE)),
):
    return await StudentTeamService(db).get_mi_equipo(usuario)


@router.patch("/equipo/nombre", response_model=MiEquipoStudentResponse, status_code=status.HTTP_200_OK)
async def renombrar_equipo(
    data: RenombrarEquipoRequest,
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ESTUDIANTE)),
):
    return await StudentTeamService(db).renombrar_equipo(usuario, data)
