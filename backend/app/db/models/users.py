import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RolUsuario(str, PyEnum):
    ESTUDIANTE = "estudiante"
    ADMIN = "admin"
    JUEZ = "juez"
    SUPER_ADMIN = "super_admin"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    rol: Mapped[RolUsuario] = mapped_column(
        SAEnum(RolUsuario, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    nombre_completo: Mapped[str] = mapped_column(String, nullable=False)

    colegio: Mapped[str | None] = mapped_column(String, nullable=True)
    grado: Mapped[int | None] = mapped_column(Integer, nullable=True)
    telefono: Mapped[str | None] = mapped_column(String, nullable=True)
    equipo_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("equipos.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    equipo: Mapped["Equipo | None"] = relationship(  # noqa: F821
        "Equipo",
        back_populates="miembros",
        foreign_keys=[equipo_id],
    )