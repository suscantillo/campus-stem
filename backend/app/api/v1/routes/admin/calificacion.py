import uuid

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.models.users import RolUsuario
from app.db.session import get_db
from app.schemas.calificacion import (
    AsignacionToggleRequest,
    CalificacionStatusResponse,
    CalificacionToggleRequest,
    CriterioCreate,
    CriterioResponse,
    CriterioUpdate,
    MatrizAsignacionesResponse,
    OrdenRequest,
    ResultadosResponse,
)
from app.services.calificacion_service import CalificacionService

router = APIRouter(prefix="/admin/calificacion")

_admin = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.SUPER_ADMIN))


# ── Rúbrica ────────────────────────────────────────────────────────────────────

@router.get("/criterios", response_model=list[CriterioResponse])
async def list_criterios(db: AsyncSession = Depends(get_db), _=_admin):
    return await CalificacionService(db).list_criterios()


@router.post("/criterios", response_model=CriterioResponse, status_code=201)
async def create_criterio(data: CriterioCreate, db: AsyncSession = Depends(get_db), _=_admin):
    return await CalificacionService(db).create_criterio(data)


@router.put("/criterios/{criterio_id}", response_model=CriterioResponse)
async def update_criterio(criterio_id: uuid.UUID, data: CriterioUpdate, db: AsyncSession = Depends(get_db), _=_admin):
    return await CalificacionService(db).update_criterio(criterio_id, data)


@router.delete("/criterios/{criterio_id}", status_code=204)
async def delete_criterio(criterio_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=_admin):
    await CalificacionService(db).delete_criterio(criterio_id)


@router.patch("/criterios/orden", response_model=list[CriterioResponse])
async def reorder_criterios(data: OrdenRequest, db: AsyncSession = Depends(get_db), _=_admin):
    return await CalificacionService(db).reorder_criterios(data)


# ── Asignaciones ───────────────────────────────────────────────────────────────

@router.get("/asignaciones", response_model=MatrizAsignacionesResponse)
async def get_matriz(db: AsyncSession = Depends(get_db), _=_admin):
    return await CalificacionService(db).get_matriz()


@router.post("/asignaciones/reset", response_model=MatrizAsignacionesResponse)
async def reset_asignaciones(db: AsyncSession = Depends(get_db), _=_admin):
    return await CalificacionService(db).reset_asignaciones()


@router.post("/asignaciones/toggle", response_model=MatrizAsignacionesResponse)
async def toggle_asignacion(data: AsignacionToggleRequest, db: AsyncSession = Depends(get_db), _=_admin):
    return await CalificacionService(db).toggle_asignacion(data)


# ── Toggle + status ────────────────────────────────────────────────────────────

@router.get("/status", response_model=CalificacionStatusResponse)
async def get_status(db: AsyncSession = Depends(get_db), _=_admin):
    return await CalificacionService(db).get_status()


@router.patch("/toggle", response_model=CalificacionStatusResponse)
async def toggle_calificacion(data: CalificacionToggleRequest, db: AsyncSession = Depends(get_db), _=_admin):
    return await CalificacionService(db).toggle_calificacion(data.calificacion_abierta)


# ── Resultados ─────────────────────────────────────────────────────────────────

@router.get("/resultados", response_model=ResultadosResponse)
async def get_resultados(db: AsyncSession = Depends(get_db), _=_admin):
    return await CalificacionService(db).get_resultados()


@router.get("/resultados/export")
async def export_excel(db: AsyncSession = Depends(get_db), _=_admin):
    xlsx_bytes = await CalificacionService(db).export_excel()
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=resultados-campus-stem.xlsx"},
    )
