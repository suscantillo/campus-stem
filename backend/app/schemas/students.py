import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class StudentListItem(BaseModel):
    id: uuid.UUID
    nombre_completo: str
    colegio: str | None
    grado: int | None
    email: EmailStr
    telefono: str | None
    equipo_id: uuid.UUID | None = None
    equipo_nombre: str | None = None
    es_lider: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentListResponse(BaseModel):
    items: list[StudentListItem]
    total: int
