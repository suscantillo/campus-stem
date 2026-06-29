import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ── Criterios ──────────────────────────────────────────────────────────────────

class CriterioCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    descripcion: str | None = None
    puntaje_maximo: int = Field(..., ge=1)
    orden: int = Field(0, ge=0)


class CriterioUpdate(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=200)
    descripcion: str | None = None
    puntaje_maximo: int | None = Field(None, ge=1)
    orden: int | None = Field(None, ge=0)


class CriterioResponse(BaseModel):
    id: uuid.UUID
    nombre: str
    descripcion: str | None
    puntaje_maximo: int
    orden: int

    model_config = {"from_attributes": True}


class OrdenRequest(BaseModel):
    ids: list[uuid.UUID]


# ── Asignaciones ───────────────────────────────────────────────────────────────

class JuezInfo(BaseModel):
    id: uuid.UUID
    nombre_completo: str

    model_config = {"from_attributes": True}


class EquipoInfo(BaseModel):
    id: uuid.UUID
    nombre: str

    model_config = {"from_attributes": True}


class AsignacionResponse(BaseModel):
    juez_id: uuid.UUID
    equipo_id: uuid.UUID

    model_config = {"from_attributes": True}


class MatrizAsignacionesResponse(BaseModel):
    jueces: list[JuezInfo]
    equipos: list[EquipoInfo]
    # set of "juez_id:equipo_id" strings for O(1) lookup on frontend
    asignados: list[str]


class AsignacionToggleRequest(BaseModel):
    juez_id: uuid.UUID
    equipo_id: uuid.UUID


# ── Calificación toggle ────────────────────────────────────────────────────────

class CalificacionToggleRequest(BaseModel):
    calificacion_abierta: bool


class CalificacionStatusResponse(BaseModel):
    calificacion_abierta: bool
    total_jueces: int
    total_equipos: int
    calificaciones_enviadas: int
    calificaciones_esperadas: int


# ── Scoring (juez) ─────────────────────────────────────────────────────────────

class PuntajeInput(BaseModel):
    criterio_id: uuid.UUID
    puntaje: int = Field(..., ge=0)


class CalificacionRequest(BaseModel):
    puntajes: list[PuntajeInput]
    comentario: str | None = None


class PuntajeResponse(BaseModel):
    criterio_id: uuid.UUID | None
    criterio_nombre: str | None
    puntaje: int
    puntaje_maximo: int | None

    model_config = {"from_attributes": True}


class CalificacionResponse(BaseModel):
    id: uuid.UUID
    juez_id: uuid.UUID | None
    equipo_id: uuid.UUID | None
    comentario: str | None
    total: int
    created_at: datetime
    puntajes: list[PuntajeResponse]

    model_config = {"from_attributes": True}


class EquipoAsignadoResponse(BaseModel):
    equipo_id: uuid.UUID
    equipo_nombre: str
    calificacion: CalificacionResponse | None  # None = pendiente


# ── Resultados (admin) ─────────────────────────────────────────────────────────

class NotaJuezResponse(BaseModel):
    juez_id: uuid.UUID
    juez_nombre: str
    total: int | None  # None = no enviada


class ResultadoEquipoResponse(BaseModel):
    posicion: int
    equipo_id: uuid.UUID
    equipo_nombre: str
    notas: list[NotaJuezResponse]
    promedio: float | None  # None = sin calificaciones
    calificaciones_recibidas: int
    calificaciones_esperadas: int
    estado: str  # "Completo" | "Parcial" | "Sin calificar"


class ResultadosResponse(BaseModel):
    criterios: list[CriterioResponse]
    resultados: list[ResultadoEquipoResponse]
    jueces: list[JuezInfo]
