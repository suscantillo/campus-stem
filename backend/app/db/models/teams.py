import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

PRESUPUESTO_DEFAULT = 1000


class Equipo(Base):
    __tablename__ = "equipos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, nullable=False)
    lider_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    presupuesto: Mapped[int] = mapped_column(Integer, nullable=False, default=PRESUPUESTO_DEFAULT)
    nombre_confirmado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    miembros: Mapped[list["Usuario"]] = relationship(  # noqa: F821
        "Usuario",
        back_populates="equipo",
        foreign_keys="Usuario.equipo_id",
    )
    lider: Mapped["Usuario | None"] = relationship(  # noqa: F821
        "Usuario",
        foreign_keys=[lider_id],
    )
    compras: Mapped[list["Compra"]] = relationship(  # noqa: F821
        "Compra",
        back_populates="equipo",
    )
