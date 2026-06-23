from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.models.users import RolUsuario, Usuario
from app.schemas.privileged_users import (
    CreatePrivilegedUserRequest,
    PrivilegedRole,
    PrivilegedUserResponse,
)

ROLE_MAP = {
    PrivilegedRole.ADMIN: RolUsuario.ADMIN,
    PrivilegedRole.JUEZ: RolUsuario.JUEZ,
}


class PrivilegedUsersService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_privileged_user(
        self, data: CreatePrivilegedUserRequest
    ) -> PrivilegedUserResponse:
        user = Usuario(
            email=str(data.email).lower(),
            password_hash=hash_password(data.password),
            rol=ROLE_MAP[data.rol],
            nombre_completo=data.nombre_completo,
        )
        self.db.add(user)

        try:
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            ) from exc

        await self.db.refresh(user)
        return PrivilegedUserResponse(
            id=str(user.id),
            email=user.email,
            rol=PrivilegedRole(user.rol.value),
            nombre_completo=user.nombre_completo,
        )
