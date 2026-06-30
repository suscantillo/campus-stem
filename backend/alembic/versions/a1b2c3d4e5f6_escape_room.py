"""escape room progress table

Revision ID: a1b2c3d4e5f6
Revises: e1f2a3b4c5d6
Create Date: 2026-06-29
"""
from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "e1f2a3b4c5d6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "escape_room_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("equipo_id", sa.String(length=30), nullable=False),
        sa.Column(
            "estaciones_completadas",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column("iniciado_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completado_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completado", sa.Boolean(), nullable=False, server_default="false"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("equipo_id"),
    )
    op.create_index("ix_escape_room_progress_equipo_id", "escape_room_progress", ["equipo_id"])


def downgrade() -> None:
    op.drop_index("ix_escape_room_progress_equipo_id", table_name="escape_room_progress")
    op.drop_table("escape_room_progress")
