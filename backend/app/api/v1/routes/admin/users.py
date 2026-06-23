from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.models.users import RolUsuario, Usuario
from app.db.session import get_db
from app.schemas.privileged_users import (
    CreatePrivilegedUserRequest,
    PrivilegedUserResponse,
)
from app.services.privileged_users_service import PrivilegedUsersService

router = APIRouter(prefix="/admin/users")


@router.post(
    "",
    response_model=PrivilegedUserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_privileged_user(
    data: CreatePrivilegedUserRequest,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.SUPER_ADMIN)),
):
    service = PrivilegedUsersService(db)
    return await service.create_privileged_user(data)
