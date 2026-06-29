import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Producto(Base):
    __tablename__ = "productos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    precio: Mapped[int] = mapped_column(Integer, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    compras: Mapped[list["Compra"]] = relationship("Compra", back_populates="producto")


class Compra(Base):
    __tablename__ = "compras"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    equipo_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("equipos.id", ondelete="SET NULL"), nullable=True, index=True
    )
    producto_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("productos.id", ondelete="SET NULL"), nullable=True, index=True
    )
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    precio_unitario: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    equipo: Mapped["Equipo | None"] = relationship("Equipo", back_populates="compras")  # noqa: F821
    producto: Mapped["Producto | None"] = relationship("Producto", back_populates="compras")
    reversiones: Mapped[list["ReversionCompra"]] = relationship(
        "ReversionCompra", back_populates="compra", cascade="all, delete-orphan"
    )


class ReversionCompra(Base):
    __tablename__ = "reversiones_compra"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    compra_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("compras.id", ondelete="CASCADE"), nullable=False, index=True
    )
    admin_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True
    )
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    compra: Mapped["Compra"] = relationship("Compra", back_populates="reversiones")
    admin: Mapped["Usuario | None"] = relationship("Usuario", foreign_keys=[admin_id])  # noqa: F821
