import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class MiembroEquipoResponse(BaseModel):
    id: uuid.UUID
    nombre_completo: str
    colegio: str | None
    grado: int | None
    es_lider: bool

    model_config = {"from_attributes": True}


class MiEquipoStudentResponse(BaseModel):
    equipo_id: uuid.UUID
    equipo_nombre: str
    nombre_confirmado: bool
    presupuesto: int
    es_lider: bool
    miembros: list[MiembroEquipoResponse]


class RenombrarEquipoRequest(BaseModel):
    nombre: str = Field(min_length=3, strip_whitespace=True)
