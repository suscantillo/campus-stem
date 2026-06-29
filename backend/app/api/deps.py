import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.models.teams import Equipo
from app.db.models.users import RolUsuario, Usuario
from app.db.session import get_db

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )

    try:
        parsed_id = uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        ) from exc

    result = await db.execute(select(Usuario).where(Usuario.id == parsed_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def require_roles(*roles: RolUsuario):
    async def _dep(user: Usuario = Depends(get_current_user)) -> Usuario:
        if user.rol not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return _dep


async def get_current_juez(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.rol != RolUsuario.JUEZ:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los jueces pueden acceder aquí.")
    return user


async def get_current_lider(
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Require the current user to be the designated líder of their team."""
    if user.rol != RolUsuario.ESTUDIANTE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    if user.equipo_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No perteneces a ningún equipo.")

    result = await db.execute(
        select(Equipo).where(Equipo.id == user.equipo_id)
    )
    equipo = result.scalar_one_or_none()
    if equipo is None or equipo.lider_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo el líder puede realizar esta acción.")

    return user
