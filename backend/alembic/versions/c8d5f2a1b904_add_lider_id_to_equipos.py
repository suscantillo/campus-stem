"""add lider_id to equipos

Revision ID: c8d5f2a1b904
Revises: b7c4e1f92a03
Create Date: 2026-06-22 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8d5f2a1b904"
down_revision: Union[str, Sequence[str], None] = "b7c4e1f92a03"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("equipos", sa.Column("lider_id", sa.Uuid(), nullable=True))
    op.create_index(op.f("ix_equipos_lider_id"), "equipos", ["lider_id"], unique=False)
    op.create_foreign_key(
        "fk_equipos_lider_id_usuarios",
        "equipos",
        "usuarios",
        ["lider_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_equipos_lider_id_usuarios", "equipos", type_="foreignkey")
    op.drop_index(op.f("ix_equipos_lider_id"), table_name="equipos")
    op.drop_column("equipos", "lider_id")
