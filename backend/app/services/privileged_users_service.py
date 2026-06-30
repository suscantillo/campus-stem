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
    UpdatePrivilegedUserRequest,
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

    async def list_jueces(self) -> list[PrivilegedUserResponse]:
        result = await self.db.execute(
            select(Usuario)
            .where(Usuario.rol == RolUsuario.JUEZ)
            .order_by(Usuario.nombre_completo)
        )
        return [
            PrivilegedUserResponse(
                id=str(u.id),
                email=u.email,
                rol=PrivilegedRole.JUEZ,
                nombre_completo=u.nombre_completo,
            )
            for u in result.scalars().all()
        ]

    async def update_juez(self, user_id: str, data: UpdatePrivilegedUserRequest) -> PrivilegedUserResponse:
        result = await self.db.execute(
            select(Usuario).where(Usuario.id == user_id, Usuario.rol == RolUsuario.JUEZ)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Juez no encontrado.")

        if data.nombre_completo is not None:
            user.nombre_completo = data.nombre_completo.strip()
        if data.email is not None:
            user.email = str(data.email).lower()
        if data.password is not None:
            user.password_hash = hash_password(data.password)

        try:
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered") from exc

        await self.db.refresh(user)
        return PrivilegedUserResponse(
            id=str(user.id),
            email=user.email,
            rol=PrivilegedRole.JUEZ,
            nombre_completo=user.nombre_completo,
        )

    async def delete_juez(self, user_id: str) -> None:
        result = await self.db.execute(
            select(Usuario).where(Usuario.id == user_id, Usuario.rol == RolUsuario.JUEZ)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Juez no encontrado.")
        await self.db.delete(user)
        await self.db.commit()
