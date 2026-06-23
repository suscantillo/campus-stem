from typing import Callable

from fastapi import Depends, HTTPException, status

from app.api.deps import get_current_user
from app.db.models.users import RolUsuario, Usuario


def require_roles(*allowed: RolUsuario) -> Callable:
    async def checker(user: Usuario = Depends(get_current_user)) -> Usuario:
        if user.rol == RolUsuario.SUPER_ADMIN:
            return user
        if user.rol not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return checker
