from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.permissions import require_roles
from app.db.models.users import RolUsuario
from app.schemas.helios import (
    AddHeliosMiembroRequest,
    AdminHeliosResponse,
    CreateHeliosEquipoRequest,
    EstudianteDisponibleResponse,
    HeliosEquipoAdminResponse,
    SetHeliosLiderRequest,
)
from app.services import helios_service

router = APIRouter(prefix="/admin/helios")

_any_admin = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.SUPER_ADMIN))


# ── Game overview / reset routes ───────────────────────────────────────────────

@router.get("", response_model=AdminHeliosResponse)
async def get_overview(db: AsyncSession = Depends(get_db), _=_any_admin):
    return await helios_service.get_admin_overview(db)


@router.post("/reset/{equipo_id}", status_code=204)
async def reset_equipo(equipo_id: str, db: AsyncSession = Depends(get_db), _=_any_admin):
    ok = await helios_service.reset_equipo(db, equipo_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")


@router.post("/reset", status_code=204)
async def reset_all(db: AsyncSession = Depends(get_db), _=_any_admin):
    await helios_service.reset_all(db)


# ── Team management routes ─────────────────────────────────────────────────────

@router.get("/equipos", response_model=list[HeliosEquipoAdminResponse])
async def list_equipos(db: AsyncSession = Depends(get_db), _=_any_admin):
    return await helios_service.list_helios_equipos_admin(db)


@router.post("/equipos", response_model=HeliosEquipoAdminResponse)
async def create_equipo(
    body: CreateHeliosEquipoRequest,
    db: AsyncSession = Depends(get_db),
    _=_any_admin,
):
    return await helios_service.create_helios_equipo(db, body.nombre)


@router.delete("/equipos/{equipo_id}", status_code=204)
async def delete_equipo(equipo_id: str, db: AsyncSession = Depends(get_db), _=_any_admin):
    await helios_service.delete_helios_equipo(db, equipo_id)


@router.post("/equipos/{equipo_id}/miembros", response_model=HeliosEquipoAdminResponse)
async def add_miembro(
    equipo_id: str,
    body: AddHeliosMiembroRequest,
    db: AsyncSession = Depends(get_db),
    _=_any_admin,
):
    return await helios_service.add_helios_miembro(db, equipo_id, body.usuario_id)


@router.delete("/equipos/{equipo_id}/miembros/{usuario_id}", status_code=204)
async def remove_miembro(
    equipo_id: str,
    usuario_id: str,
    db: AsyncSession = Depends(get_db),
    _=_any_admin,
):
    await helios_service.remove_helios_miembro(db, equipo_id, usuario_id)


@router.put("/equipos/{equipo_id}/lider", status_code=204)
async def set_lider(
    equipo_id: str,
    body: SetHeliosLiderRequest,
    db: AsyncSession = Depends(get_db),
    _=_any_admin,
):
    await helios_service.set_helios_lider(db, equipo_id, body.usuario_id)


@router.get("/estudiantes-disponibles", response_model=list[EstudianteDisponibleResponse])
async def get_estudiantes_disponibles(db: AsyncSession = Depends(get_db), _=_any_admin):
    return await helios_service.get_estudiantes_disponibles(db)
