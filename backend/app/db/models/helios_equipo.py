from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class HeliosEquipo(Base):
    __tablename__ = "helios_equipos"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    ruta: Mapped[str] = mapped_column(String(30), nullable=False)
    lider_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    miembros: Mapped[list["HeliosEquipoMiembro"]] = relationship(
        "HeliosEquipoMiembro",
        back_populates="equipo",
        cascade="all, delete-orphan",
    )
    lider: Mapped["Usuario | None"] = relationship(  # noqa: F821
        "Usuario",
        foreign_keys=[lider_id],
    )
    progreso: Mapped["EscapeRoomProgress | None"] = relationship(  # noqa: F821
        "EscapeRoomProgress",
        back_populates="equipo",
        uselist=False,
    )


class HeliosEquipoMiembro(Base):
    __tablename__ = "helios_equipo_miembros"
    __table_args__ = (
        UniqueConstraint("usuario_id", name="uq_helios_miembro_usuario"),
    )

    equipo_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("helios_equipos.id", ondelete="CASCADE"),
        primary_key=True,
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        primary_key=True,
    )

    equipo: Mapped["HeliosEquipo"] = relationship("HeliosEquipo", back_populates="miembros")
    usuario: Mapped["Usuario"] = relationship("Usuario", foreign_keys=[usuario_id])  # noqa: F821
