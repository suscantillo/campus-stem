from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.models.users import RolUsuario, Usuario
from app.db.session import get_db
from app.schemas.platform_controls import (
    RegistrationAdminResponse,
    RegistrationToggleRequest,
)
from app.services.platform_controls_service import PlatformControlsService

router = APIRouter(prefix="/admin/registration")


@router.patch("", response_model=RegistrationAdminResponse)
async def toggle_registration(
    data: RegistrationToggleRequest,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    service = PlatformControlsService(db)
    controls = await service.set_registration_enabled(data.enabled)
    return RegistrationAdminResponse(
        enabled=controls.registration_enabled,
        updated_at=controls.updated_at,
    )
