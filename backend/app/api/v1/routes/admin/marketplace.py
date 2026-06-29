from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.models.users import RolUsuario, Usuario
from app.db.session import get_db
from app.schemas.marketplace import (
    CompraListResponse,
    CompraResponse,
    EquipoPresupuestoListResponse,
    EquipoPresupuestoResponse,
    MarketplaceStatusResponse,
    MarketplaceToggleRequest,
    PresupuestoUpdateRequest,
    ProductoCreate,
    ProductoListResponse,
    ProductoResponse,
    ProductoUpdate,
    ReversionRequest,
)
from app.services.marketplace_service import MarketplaceService
from app.services.platform_controls_service import PlatformControlsService

router = APIRouter(prefix="/admin/marketplace")


@router.patch("/toggle", response_model=MarketplaceStatusResponse)
async def toggle_marketplace(
    data: MarketplaceToggleRequest,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    service = PlatformControlsService(db)
    controls = await service.set_marketplace_abierto(data.marketplace_abierto)
    return MarketplaceStatusResponse(
        marketplace_abierto=controls.marketplace_abierto,
        updated_at=controls.updated_at,
    )


@router.get("/productos", response_model=ProductoListResponse)
async def list_productos(
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    return await MarketplaceService(db).list_productos()


@router.post("/productos", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
async def create_producto(
    data: ProductoCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    return await MarketplaceService(db).create_producto(data)


@router.put("/productos/{producto_id}", response_model=ProductoResponse)
async def update_producto(
    producto_id: UUID,
    data: ProductoUpdate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    return await MarketplaceService(db).update_producto(producto_id, data)


@router.delete("/productos/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_producto(
    producto_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    await MarketplaceService(db).delete_producto(producto_id)


@router.get("/equipos/presupuestos", response_model=EquipoPresupuestoListResponse)
async def list_presupuestos(
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    return await MarketplaceService(db).list_presupuestos()


@router.patch("/equipos/{equipo_id}/presupuesto", response_model=EquipoPresupuestoResponse)
async def set_presupuesto(
    equipo_id: UUID,
    data: PresupuestoUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    return await MarketplaceService(db).set_presupuesto(equipo_id, data.presupuesto)


@router.get("/compras", response_model=CompraListResponse)
async def list_compras(
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    return await MarketplaceService(db).list_all_compras()


@router.post("/compras/{compra_id}/revertir", response_model=CompraResponse)
async def revertir_compra(
    compra_id: UUID,
    data: ReversionRequest,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    return await MarketplaceService(db).revertir_compra(compra_id, data, admin)
