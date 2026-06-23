from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.platform_controls import SINGLETON_ID, PlatformControls


class PlatformControlsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_controls(self) -> PlatformControls:
        controls = await self.db.get(PlatformControls, SINGLETON_ID)
        if controls is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Platform controls not initialized",
            )
        return controls

    async def is_registration_enabled(self) -> bool:
        controls = await self.get_controls()
        return controls.registration_enabled

    async def set_registration_enabled(self, enabled: bool) -> PlatformControls:
        controls = await self.get_controls()
        controls.registration_enabled = enabled
        controls.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(controls)
        return controls
