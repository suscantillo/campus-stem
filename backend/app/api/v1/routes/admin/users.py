from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.models.users import RolUsuario, Usuario
from app.db.session import get_db
from app.schemas.privileged_users import (
    CreatePrivilegedUserRequest,
    PrivilegedUserResponse,
    UpdatePrivilegedUserRequest,
)
from app.services.privileged_users_service import PrivilegedUsersService

router = APIRouter(prefix="/admin/users")

_super = Depends(require_roles(RolUsuario.SUPER_ADMIN))
_any_admin = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.SUPER_ADMIN))


@router.post("", response_model=PrivilegedUserResponse, status_code=status.HTTP_201_CREATED)
async def create_privileged_user(
    data: CreatePrivilegedUserRequest,
    db: AsyncSession = Depends(get_db),
    _=_super,
):
    service = PrivilegedUsersService(db)
    return await service.create_privileged_user(data)


@router.get("/jueces", response_model=list[PrivilegedUserResponse])
async def list_jueces(db: AsyncSession = Depends(get_db), _=_any_admin):
    service = PrivilegedUsersService(db)
    return await service.list_jueces()


@router.put("/jueces/{user_id}", response_model=PrivilegedUserResponse)
async def update_juez(
    user_id: str,
    data: UpdatePrivilegedUserRequest,
    db: AsyncSession = Depends(get_db),
    _=_any_admin,
):
    service = PrivilegedUsersService(db)
    return await service.update_juez(user_id, data)


@router.delete("/jueces/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_juez(user_id: str, db: AsyncSession = Depends(get_db), _=_any_admin):
    service = PrivilegedUsersService(db)
    await service.delete_juez(user_id)
