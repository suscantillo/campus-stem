from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.platform_controls import RegistrationStatusResponse
from app.services.platform_controls_service import PlatformControlsService

router = APIRouter(prefix="/registration")


@router.get("/status", response_model=RegistrationStatusResponse)
async def get_registration_status(db: AsyncSession = Depends(get_db)):
    service = PlatformControlsService(db)
    enabled = await service.is_registration_enabled()
    return RegistrationStatusResponse(enabled=enabled)
