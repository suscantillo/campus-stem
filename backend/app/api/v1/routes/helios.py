from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.models.users import Usuario
from app.schemas.helios import (
    ConfirmarBloqueGRequest,
    EquipoProgressResponse,
    IniciarResponse,
    ValidarFinalRequest,
    ValidarFinalResponse,
    ValidarRequest,
    ValidarResponse,
)
from app.services import helios_service

router = APIRouter(prefix="/helios")


@router.get("/mi-equipo", response_model=EquipoProgressResponse)
async def get_my_team(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await helios_service.get_my_team(db, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="No perteneces a ningún equipo Helios.")
    return result


@router.get("/equipos/{equipo_id}", response_model=EquipoProgressResponse)
async def get_progress(
    equipo_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await helios_service.get_progress(db, equipo_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")
    return result


@router.post("/iniciar/{equipo_id}", response_model=IniciarResponse)
async def iniciar(
    equipo_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return await helios_service.iniciar_juego(db, equipo_id, current_user.id)


@router.post("/validar", response_model=ValidarResponse)
async def validar(
    req: ValidarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await helios_service.validar_respuesta(db, req, current_user.id)
    if result is None:
        raise HTTPException(status_code=404, detail="Equipo o estación no encontrada.")
    return result


@router.post("/confirmar-bloque-g", response_model=ValidarResponse)
async def confirmar_bloque_g(
    req: ConfirmarBloqueGRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await helios_service.confirmar_bloque_g(db, req.equipo_id, current_user.id)
    if result is None:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")
    return result


@router.post("/validar-final", response_model=ValidarFinalResponse)
async def validar_final(
    req: ValidarFinalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await helios_service.validar_final(db, req.equipo_id, req.respuesta, current_user.id)
    if result is None:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")
    return result
