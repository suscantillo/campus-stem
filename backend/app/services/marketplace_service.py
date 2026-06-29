import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.marketplace import Compra, Producto, ReversionCompra
from app.db.models.platform_controls import SINGLETON_ID, PlatformControls
from app.db.models.teams import Equipo
from app.db.models.users import Usuario
from app.schemas.marketplace import (
    CompraListResponse,
    CompraRequest,
    CompraResponse,
    EquipoPresupuestoListResponse,
    EquipoPresupuestoResponse,
    MiEquipoResponse,
    ProductoCreate,
    ProductoListResponse,
    ProductoResponse,
    ProductoUpdate,
    ReversionRequest,
    ReversionResponse,
)


def _reversion_to_response(r: ReversionCompra) -> ReversionResponse:
    return ReversionResponse(
        id=r.id,
        compra_id=r.compra_id,
        admin_id=r.admin_id,
        admin_nombre=r.admin.nombre_completo if r.admin else None,
        cantidad=r.cantidad,
        created_at=r.created_at,
    )


def _compra_to_response(c: Compra) -> CompraResponse:
    cantidad_revertida = sum(r.cantidad for r in c.reversiones)
    return CompraResponse(
        id=c.id,
        equipo_id=c.equipo_id,
        equipo_nombre=c.equipo.nombre if c.equipo else None,
        producto_id=c.producto_id,
        producto_nombre=c.producto.nombre if c.producto else None,
        cantidad=c.cantidad,
        precio_unitario=c.precio_unitario,
        total=c.cantidad * c.precio_unitario,
        cantidad_revertida=cantidad_revertida,
        cantidad_disponible=c.cantidad - cantidad_revertida,
        reversiones=[_reversion_to_response(r) for r in c.reversiones],
        created_at=c.created_at,
    )


class MarketplaceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Productos ──────────────────────────────────────────────────────────

    async def list_productos(self) -> ProductoListResponse:
        result = await self.db.execute(
            select(Producto).order_by(Producto.created_at.asc())
        )
        items = result.scalars().all()
        return ProductoListResponse(
            items=[ProductoResponse.model_validate(p) for p in items],
            total=len(items),
        )

    async def create_producto(self, data: ProductoCreate) -> ProductoResponse:
        producto = Producto(
            nombre=data.nombre,
            descripcion=data.descripcion,
            precio=data.precio,
            stock=data.stock,
        )
        self.db.add(producto)
        await self.db.commit()
        await self.db.refresh(producto)
        return ProductoResponse.model_validate(producto)

    async def update_producto(self, producto_id: uuid.UUID, data: ProductoUpdate) -> ProductoResponse:
        producto = await self.db.get(Producto, producto_id)
        if producto is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")
        if data.nombre is not None:
            producto.nombre = data.nombre
        if data.descripcion is not None:
            producto.descripcion = data.descripcion
        if data.precio is not None:
            producto.precio = data.precio
        if data.stock is not None:
            producto.stock = data.stock
        await self.db.commit()
        await self.db.refresh(producto)
        return ProductoResponse.model_validate(producto)

    async def delete_producto(self, producto_id: uuid.UUID) -> None:
        producto = await self.db.get(Producto, producto_id)
        if producto is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")
        await self.db.delete(producto)
        await self.db.commit()

    # ── Presupuestos ───────────────────────────────────────────────────────

    async def list_presupuestos(self) -> EquipoPresupuestoListResponse:
        result = await self.db.execute(select(Equipo).order_by(Equipo.nombre.asc()))
        equipos = result.scalars().all()
        return EquipoPresupuestoListResponse(
            items=[EquipoPresupuestoResponse.model_validate(e) for e in equipos],
            total=len(equipos),
        )

    async def set_presupuesto(self, equipo_id: uuid.UUID, presupuesto: int) -> EquipoPresupuestoResponse:
        equipo = await self.db.get(Equipo, equipo_id)
        if equipo is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado.")
        equipo.presupuesto = presupuesto
        await self.db.commit()
        await self.db.refresh(equipo)
        return EquipoPresupuestoResponse.model_validate(equipo)

    # ── Compras (admin) ────────────────────────────────────────────────────

    async def list_all_compras(self) -> CompraListResponse:
        result = await self.db.execute(
            select(Compra)
            .options(
                selectinload(Compra.equipo),
                selectinload(Compra.producto),
                selectinload(Compra.reversiones).selectinload(ReversionCompra.admin),
            )
            .order_by(Compra.created_at.desc())
        )
        compras = result.scalars().all()
        return CompraListResponse(
            items=[_compra_to_response(c) for c in compras],
            total=len(compras),
        )

    async def revertir_compra(
        self, compra_id: uuid.UUID, data: ReversionRequest, admin: Usuario
    ) -> CompraResponse:
        # Cargar compra con relaciones y bloqueo
        result = await self.db.execute(
            select(Compra)
            .options(
                selectinload(Compra.equipo),
                selectinload(Compra.producto),
                selectinload(Compra.reversiones).selectinload(ReversionCompra.admin),
            )
            .where(Compra.id == compra_id)
            .with_for_update()
        )
        compra = result.scalar_one_or_none()
        if compra is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compra no encontrada.")

        cantidad_revertida = sum(r.cantidad for r in compra.reversiones)
        cantidad_disponible = compra.cantidad - cantidad_revertida
        if data.cantidad > cantidad_disponible:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cantidad supera lo disponible para revertir ({cantidad_disponible}).",
            )

        # Restaurar stock si el producto aún existe
        if compra.producto_id is not None:
            prod_result = await self.db.execute(
                select(Producto).where(Producto.id == compra.producto_id).with_for_update()
            )
            producto = prod_result.scalar_one_or_none()
            if producto is not None:
                producto.stock += data.cantidad

        # Restaurar presupuesto si el equipo aún existe
        if compra.equipo_id is not None:
            eq_result = await self.db.execute(
                select(Equipo).where(Equipo.id == compra.equipo_id).with_for_update()
            )
            equipo = eq_result.scalar_one_or_none()
            if equipo is not None:
                equipo.presupuesto += data.cantidad * compra.precio_unitario

        # Registrar reversión
        reversion = ReversionCompra(
            compra_id=compra.id,
            admin_id=admin.id,
            cantidad=data.cantidad,
        )
        self.db.add(reversion)
        await self.db.commit()

        # Recargar compra completa para respuesta
        result2 = await self.db.execute(
            select(Compra)
            .options(
                selectinload(Compra.equipo),
                selectinload(Compra.producto),
                selectinload(Compra.reversiones).selectinload(ReversionCompra.admin),
            )
            .where(Compra.id == compra_id)
        )
        compra_reload = result2.scalar_one()
        return _compra_to_response(compra_reload)

    # ── Compras (líder) ────────────────────────────────────────────────────

    async def get_mi_equipo(self, usuario: Usuario) -> MiEquipoResponse:
        if usuario.equipo_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No perteneces a ningún equipo.",
            )
        equipo = await self.db.get(Equipo, usuario.equipo_id)
        if equipo is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado.")

        result = await self.db.execute(
            select(Compra)
            .options(
                selectinload(Compra.equipo),
                selectinload(Compra.producto),
                selectinload(Compra.reversiones).selectinload(ReversionCompra.admin),
            )
            .where(Compra.equipo_id == equipo.id)
            .order_by(Compra.created_at.desc())
        )
        compras = result.scalars().all()
        return MiEquipoResponse(
            equipo_id=equipo.id,
            equipo_nombre=equipo.nombre,
            presupuesto=equipo.presupuesto,
            compras=[_compra_to_response(c) for c in compras],
        )

    async def comprar(self, usuario: Usuario, data: CompraRequest) -> CompraResponse:
        # Verificar gate
        controls = await self.db.get(PlatformControls, SINGLETON_ID)
        if controls is None or not controls.marketplace_abierto:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Marketplace is currently closed.",
            )

        # Verificar equipo del líder
        if usuario.equipo_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No perteneces a ningún equipo.",
            )

        # Cargar producto y equipo con bloqueo
        producto_result = await self.db.execute(
            select(Producto).where(Producto.id == data.producto_id).with_for_update()
        )
        producto = producto_result.scalar_one_or_none()
        if producto is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")

        equipo_result = await self.db.execute(
            select(Equipo).where(Equipo.id == usuario.equipo_id).with_for_update()
        )
        equipo = equipo_result.scalar_one_or_none()
        if equipo is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado.")

        # Validaciones de negocio
        if producto.stock < data.cantidad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient stock.",
            )
        total = producto.precio * data.cantidad
        if equipo.presupuesto < total:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient budget.",
            )

        # Transacción atómica
        producto.stock -= data.cantidad
        equipo.presupuesto -= total
        compra = Compra(
            equipo_id=equipo.id,
            producto_id=producto.id,
            cantidad=data.cantidad,
            precio_unitario=producto.precio,
        )
        self.db.add(compra)
        await self.db.commit()
        await self.db.refresh(compra)

        # Reload relations for response
        result = await self.db.execute(
            select(Compra)
            .options(
                selectinload(Compra.equipo),
                selectinload(Compra.producto),
                selectinload(Compra.reversiones).selectinload(ReversionCompra.admin),
            )
            .where(Compra.id == compra.id)
        )
        compra_loaded = result.scalar_one()
        return _compra_to_response(compra_loaded)
