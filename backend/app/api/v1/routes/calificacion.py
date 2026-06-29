import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_juez
from app.db.models.users import Usuario
from app.db.session import get_db
from app.schemas.calificacion import (
    CalificacionRequest,
    CalificacionResponse,
    CalificacionStatusResponse,
    CriterioResponse,
    EquipoAsignadoResponse,
)
from app.services.calificacion_service import CalificacionService
from app.services.platform_controls_service import PlatformControlsService

router = APIRouter(prefix="/calificacion")


@router.get("/status")
async def get_status_publico(db: AsyncSession = Depends(get_db)):
    svc = PlatformControlsService(db)
    abierta = await svc.is_calificacion_abierta()
    return {"calificacion_abierta": abierta}


@router.get("/criterios", response_model=list[CriterioResponse])
async def get_criterios(
    db: AsyncSession = Depends(get_db),
    juez: Usuario = Depends(get_current_juez),
):
    return await CalificacionService(db).list_criterios()


@router.get("/mis-equipos", response_model=list[EquipoAsignadoResponse])
async def get_mis_equipos(
    db: AsyncSession = Depends(get_db),
    juez: Usuario = Depends(get_current_juez),
):
    return await CalificacionService(db).get_mis_equipos(juez.id)


@router.post("/equipos/{equipo_id}", response_model=CalificacionResponse, status_code=201)
async def enviar_calificacion(
    equipo_id: uuid.UUID,
    data: CalificacionRequest,
    db: AsyncSession = Depends(get_db),
    juez: Usuario = Depends(get_current_juez),
):
    return await CalificacionService(db).enviar_calificacion(juez.id, equipo_id, data)
