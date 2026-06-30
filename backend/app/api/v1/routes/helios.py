from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.data.helios import EQUIPOS
from app.schemas.helios import (
    ConfirmarBloqueGRequest,
    EquipoLoginRequest,
    EquipoProgressResponse,
    IniciarResponse,
    ValidarFinalRequest,
    ValidarFinalResponse,
    ValidarRequest,
    ValidarResponse,
)
from app.services import helios_service

router = APIRouter(prefix="/helios")


@router.post("/login", response_model=EquipoProgressResponse)
async def login(req: EquipoLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await helios_service.login_equipo(db, req.codigo)
    if not result:
        raise HTTPException(status_code=404, detail="Código de equipo no reconocido.")
    return result


@router.get("/equipos/{equipo_id}", response_model=EquipoProgressResponse)
async def get_progress(equipo_id: str, db: AsyncSession = Depends(get_db)):
    result = await helios_service.get_progress(db, equipo_id)
    if not result:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")
    return result


@router.post("/iniciar/{equipo_id}", response_model=IniciarResponse)
async def iniciar(equipo_id: str, db: AsyncSession = Depends(get_db)):
    result = await helios_service.iniciar_juego(db, equipo_id)
    if not result:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")
    return result


@router.post("/validar", response_model=ValidarResponse)
async def validar(req: ValidarRequest, db: AsyncSession = Depends(get_db)):
    result = await helios_service.validar_respuesta(db, req)
    if result is None:
        raise HTTPException(status_code=404, detail="Equipo o estación no encontrada.")
    return result


@router.post("/confirmar-bloque-g", response_model=ValidarResponse)
async def confirmar_bloque_g(req: ConfirmarBloqueGRequest, db: AsyncSession = Depends(get_db)):
    result = await helios_service.confirmar_bloque_g(db, req.equipo_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")
    return result


@router.post("/validar-final", response_model=ValidarFinalResponse)
async def validar_final(req: ValidarFinalRequest, db: AsyncSession = Depends(get_db)):
    result = await helios_service.validar_final(db, req.equipo_id, req.respuesta)
    if result is None:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")
    return result
