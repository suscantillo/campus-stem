from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import ARRAY, Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EscapeRoomProgress(Base):
    __tablename__ = "escape_room_progress"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    equipo_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    estaciones_completadas: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list, server_default="{}"
    )
    iniciado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
