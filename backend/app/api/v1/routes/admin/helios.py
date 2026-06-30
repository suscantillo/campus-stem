from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.permissions import require_roles
from app.db.models.users import RolUsuario
from app.schemas.helios import AdminHeliosResponse
from app.services import helios_service

router = APIRouter(prefix="/admin/helios")

_admin = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.SUPER_ADMIN))


@router.get("", response_model=AdminHeliosResponse)
async def get_overview(db: AsyncSession = Depends(get_db), _=_admin):
    return await helios_service.get_admin_overview(db)


@router.post("/reset/{equipo_id}", status_code=204)
async def reset_equipo(equipo_id: str, db: AsyncSession = Depends(get_db), _=_admin):
    ok = await helios_service.reset_equipo(db, equipo_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")


@router.post("/reset", status_code=204)
async def reset_all(db: AsyncSession = Depends(get_db), _=_admin):
    await helios_service.reset_all(db)
