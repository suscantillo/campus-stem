"""helios teams — authenticated team model for Helios escape room

Revision ID: c3d4e5f6a7b8
Revises: a1b2c3d4e5f6
Create Date: 2026-06-29
"""
from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create helios_equipos table
    op.create_table(
        "helios_equipos",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nombre", sa.String(length=30), nullable=False),
        sa.Column("ruta", sa.String(length=30), nullable=False),
        sa.Column("lider_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["lider_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nombre"),
    )

    # 2. Create helios_equipo_miembros table
    op.create_table(
        "helios_equipo_miembros",
        sa.Column("equipo_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["equipo_id"], ["helios_equipos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("equipo_id", "usuario_id"),
        sa.UniqueConstraint("usuario_id", name="uq_helios_miembro_usuario"),
    )

    # 3. Add helios_equipo_id column (nullable first) to escape_room_progress
    op.add_column(
        "escape_room_progress",
        sa.Column("helios_equipo_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    # 4. Create FK constraint
    op.create_foreign_key(
        "fk_escape_room_helios_equipo",
        "escape_room_progress",
        "helios_equipos",
        ["helios_equipo_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # 5. Drop old index on equipo_id
    op.drop_index("ix_escape_room_progress_equipo_id", table_name="escape_room_progress")

    # 6. Drop old unique constraint on equipo_id
    op.drop_constraint("escape_room_progress_equipo_id_key", "escape_room_progress", type_="unique")

    # 7. Drop old equipo_id column
    op.drop_column("escape_room_progress", "equipo_id")

    # 8. Alter helios_equipo_id to NOT NULL
    op.alter_column("escape_room_progress", "helios_equipo_id", nullable=False)

    # 9. Create unique constraint on helios_equipo_id
    op.create_unique_constraint(
        "uq_escape_room_helios_equipo", "escape_room_progress", ["helios_equipo_id"]
    )

    # 10. Create index on helios_equipo_id
    op.create_index(
        "ix_escape_room_progress_helios_equipo_id",
        "escape_room_progress",
        ["helios_equipo_id"],
    )


def downgrade() -> None:
    pass
