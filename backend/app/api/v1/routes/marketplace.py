from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_lider
from app.core.permissions import require_roles
from app.db.models.platform_controls import SINGLETON_ID, PlatformControls
from app.db.models.users import RolUsuario, Usuario
from app.db.session import get_db
from app.schemas.marketplace import (
    CompraRequest,
    CompraResponse,
    MarketplaceStatusResponse,
    MiEquipoResponse,
    ProductoListResponse,
)
from app.services.marketplace_service import MarketplaceService

router = APIRouter(prefix="/marketplace")


@router.get("/status", response_model=MarketplaceStatusResponse)
async def marketplace_status(db: AsyncSession = Depends(get_db)):
    controls = await db.get(PlatformControls, SINGLETON_ID)
    if controls is None:
        return MarketplaceStatusResponse(
            marketplace_abierto=False,
            updated_at=datetime.now(timezone.utc),
        )
    return MarketplaceStatusResponse(
        marketplace_abierto=controls.marketplace_abierto,
        updated_at=controls.updated_at,
    )


@router.get("/productos", response_model=ProductoListResponse)
async def list_productos(
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ESTUDIANTE)),
):
    return await MarketplaceService(db).list_productos()


@router.get("/mi-equipo", response_model=MiEquipoResponse)
async def mi_equipo(
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ESTUDIANTE)),
):
    return await MarketplaceService(db).get_mi_equipo(usuario)


@router.post("/compras", response_model=CompraResponse)
async def comprar(
    data: CompraRequest,
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_lider),
):
    return await MarketplaceService(db).comprar(usuario, data)
