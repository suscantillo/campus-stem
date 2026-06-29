"""bloque calificacion

Revision ID: e1f2a3b4c5d6
Revises: b2c3d4e5f6a7
Create Date: 2026-06-29 08:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # platform_controls: añadir calificacion_abierta
    op.add_column(
        "platform_controls",
        sa.Column("calificacion_abierta", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    # criterios_rubrica
    op.create_table(
        "criterios_rubrica",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("puntaje_maximo", sa.Integer(), nullable=False),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("puntaje_maximo > 0", name="criterio_puntaje_maximo_pos"),
    )

    # asignaciones_juez
    op.create_table(
        "asignaciones_juez",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("juez_id", sa.UUID(), nullable=False),
        sa.Column("equipo_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["juez_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["equipo_id"], ["equipos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("juez_id", "equipo_id", name="uq_asignacion_juez_equipo"),
    )
    op.create_index("ix_asignaciones_juez_juez_id", "asignaciones_juez", ["juez_id"])
    op.create_index("ix_asignaciones_juez_equipo_id", "asignaciones_juez", ["equipo_id"])

    # calificaciones
    op.create_table(
        "calificaciones",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("juez_id", sa.UUID(), nullable=True),
        sa.Column("equipo_id", sa.UUID(), nullable=True),
        sa.Column("comentario", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["juez_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["equipo_id"], ["equipos.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("juez_id", "equipo_id", name="uq_calificacion_juez_equipo"),
    )
    op.create_index("ix_calificaciones_juez_id", "calificaciones", ["juez_id"])
    op.create_index("ix_calificaciones_equipo_id", "calificaciones", ["equipo_id"])

    # puntajes_criterio
    op.create_table(
        "puntajes_criterio",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("calificacion_id", sa.UUID(), nullable=False),
        sa.Column("criterio_id", sa.UUID(), nullable=True),
        sa.Column("puntaje", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["calificacion_id"], ["calificaciones.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["criterio_id"], ["criterios_rubrica.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("puntaje >= 0", name="puntaje_criterio_non_negative"),
    )
    op.create_index("ix_puntajes_criterio_calificacion_id", "puntajes_criterio", ["calificacion_id"])
    op.create_index("ix_puntajes_criterio_criterio_id", "puntajes_criterio", ["criterio_id"])


def downgrade() -> None:
    op.drop_table("puntajes_criterio")
    op.drop_table("calificaciones")
    op.drop_table("asignaciones_juez")
    op.drop_table("criterios_rubrica")
    op.drop_column("platform_controls", "calificacion_abierta")
