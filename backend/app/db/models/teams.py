import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Equipo(Base):
    __tablename__ = "equipos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, nullable=False)
    lider_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
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
