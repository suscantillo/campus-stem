from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

SINGLETON_ID = 1


class PlatformControls(Base):
    __tablename__ = "platform_controls"
    __table_args__ = (CheckConstraint("id = 1", name="platform_controls_singleton_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=SINGLETON_ID)
    registration_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    marketplace_abierto: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    calificacion_abierta: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
