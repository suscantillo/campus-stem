from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ARRAY, Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EscapeRoomProgress(Base):
    __tablename__ = "escape_room_progress"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    helios_equipo_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("helios_equipos.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    estaciones_completadas: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list, server_default="{}"
    )
    iniciado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    equipo: Mapped["HeliosEquipo | None"] = relationship(  # noqa: F821
        "HeliosEquipo",
        back_populates="progreso",
    )
