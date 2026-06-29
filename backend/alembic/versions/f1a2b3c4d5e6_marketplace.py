"""marketplace: productos, compras, presupuesto, marketplace_abierto

Revision ID: f1a2b3c4d5e6
Revises: a3762a89497b
Create Date: 2026-06-28 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'c8d5f2a1b904'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'productos',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('nombre', sa.String(200), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('precio', sa.Integer(), nullable=False),
        sa.Column('stock', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'compras',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('equipo_id', sa.UUID(), nullable=True),
        sa.Column('producto_id', sa.UUID(), nullable=True),
        sa.Column('cantidad', sa.Integer(), nullable=False),
        sa.Column('precio_unitario', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['equipo_id'], ['equipos.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['producto_id'], ['productos.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_compras_equipo_id', 'compras', ['equipo_id'])
    op.create_index('ix_compras_producto_id', 'compras', ['producto_id'])

    op.add_column(
        'equipos',
        sa.Column('presupuesto', sa.Integer(), nullable=False, server_default='1000'),
    )

    op.add_column(
        'platform_controls',
        sa.Column('marketplace_abierto', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    )


def downgrade() -> None:
    op.drop_column('platform_controls', 'marketplace_abierto')
    op.drop_column('equipos', 'presupuesto')
    op.drop_index('ix_compras_producto_id', table_name='compras')
    op.drop_index('ix_compras_equipo_id', table_name='compras')
    op.drop_table('compras')
    op.drop_table('productos')
