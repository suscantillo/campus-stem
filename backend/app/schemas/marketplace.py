import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ---------- Productos ----------

class ProductoCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=200)
    descripcion: str | None = None
    precio: int = Field(ge=0)
    stock: int = Field(ge=0)


class ProductoUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=200)
    descripcion: str | None = None
    precio: int | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)


class ProductoResponse(BaseModel):
    id: uuid.UUID
    nombre: str
    descripcion: str | None
    precio: int
    stock: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductoListResponse(BaseModel):
    items: list[ProductoResponse]
    total: int


# ---------- Presupuesto ----------

class PresupuestoUpdateRequest(BaseModel):
    presupuesto: int = Field(ge=0)


class EquipoPresupuestoResponse(BaseModel):
    id: uuid.UUID
    nombre: str
    presupuesto: int

    model_config = {"from_attributes": True}


class EquipoPresupuestoListResponse(BaseModel):
    items: list[EquipoPresupuestoResponse]
    total: int


# ---------- Compras ----------

class ReversionResponse(BaseModel):
    id: uuid.UUID
    compra_id: uuid.UUID
    admin_id: uuid.UUID | None
    admin_nombre: str | None
    cantidad: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ReversionRequest(BaseModel):
    cantidad: int = Field(ge=1)


class CompraRequest(BaseModel):
    producto_id: uuid.UUID
    cantidad: int = Field(ge=1)


class CompraResponse(BaseModel):
    id: uuid.UUID
    equipo_id: uuid.UUID | None
    equipo_nombre: str | None
    producto_id: uuid.UUID | None
    producto_nombre: str | None
    cantidad: int
    precio_unitario: int
    total: int
    cantidad_revertida: int
    cantidad_disponible: int
    reversiones: list[ReversionResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class CompraListResponse(BaseModel):
    items: list[CompraResponse]
    total: int


class MiEquipoResponse(BaseModel):
    equipo_id: uuid.UUID
    equipo_nombre: str
    presupuesto: int
    compras: list[CompraResponse]


# ---------- Marketplace toggle ----------

class MarketplaceToggleRequest(BaseModel):
    marketplace_abierto: bool


class MarketplaceStatusResponse(BaseModel):
    marketplace_abierto: bool
    updated_at: datetime

    model_config = {"from_attributes": True}
