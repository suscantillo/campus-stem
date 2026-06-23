"""create equipos table and usuario equipo_id

Revision ID: b7c4e1f92a03
Revises: a3762a89497b
Create Date: 2026-06-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7c4e1f92a03"
down_revision: Union[str, Sequence[str], None] = "a3762a89497b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "equipos",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.add_column("usuarios", sa.Column("equipo_id", sa.Uuid(), nullable=True))
    op.create_index(op.f("ix_usuarios_equipo_id"), "usuarios", ["equipo_id"], unique=False)
    op.create_foreign_key(
        "fk_usuarios_equipo_id_equipos",
        "usuarios",
        "equipos",
        ["equipo_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_usuarios_equipo_id_equipos", "usuarios", type_="foreignkey")
    op.drop_index(op.f("ix_usuarios_equipo_id"), table_name="usuarios")
    op.drop_column("usuarios", "equipo_id")
    op.drop_table("equipos")
