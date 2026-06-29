import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CriterioRubrica(Base):
    __tablename__ = "criterios_rubrica"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    puntaje_maximo: Mapped[int] = mapped_column(Integer, nullable=False)
    orden: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    puntajes: Mapped[list["PuntajeCriterio"]] = relationship(
        "PuntajeCriterio", back_populates="criterio"
    )


class AsignacionJuez(Base):
    __tablename__ = "asignaciones_juez"
    __table_args__ = (UniqueConstraint("juez_id", "equipo_id", name="uq_asignacion_juez_equipo"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    juez_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    equipo_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("equipos.id", ondelete="CASCADE"), nullable=False, index=True
    )

    juez: Mapped["Usuario"] = relationship("Usuario", foreign_keys=[juez_id])  # noqa: F821
    equipo: Mapped["Equipo"] = relationship("Equipo", foreign_keys=[equipo_id])  # noqa: F821


class Calificacion(Base):
    __tablename__ = "calificaciones"
    __table_args__ = (UniqueConstraint("juez_id", "equipo_id", name="uq_calificacion_juez_equipo"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    juez_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True
    )
    equipo_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("equipos.id", ondelete="SET NULL"), nullable=True, index=True
    )
    comentario: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    juez: Mapped["Usuario | None"] = relationship("Usuario", foreign_keys=[juez_id])  # noqa: F821
    equipo: Mapped["Equipo | None"] = relationship("Equipo", foreign_keys=[equipo_id])  # noqa: F821
    puntajes: Mapped[list["PuntajeCriterio"]] = relationship(
        "PuntajeCriterio", back_populates="calificacion", cascade="all, delete-orphan"
    )


class PuntajeCriterio(Base):
    __tablename__ = "puntajes_criterio"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    calificacion_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("calificaciones.id", ondelete="CASCADE"), nullable=False, index=True
    )
    criterio_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("criterios_rubrica.id", ondelete="SET NULL"), nullable=True, index=True
    )
    puntaje: Mapped[int] = mapped_column(Integer, nullable=False)

    calificacion: Mapped["Calificacion"] = relationship("Calificacion", back_populates="puntajes")
    criterio: Mapped["CriterioRubrica | None"] = relationship("CriterioRubrica", back_populates="puntajes")
