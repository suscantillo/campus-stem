"""reversiones_compra: auditoría de reversiones de compras

Revision ID: a9b8c7d6e5f4
Revises: f1a2b3c4d5e6
Create Date: 2026-06-28 01:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'a9b8c7d6e5f4'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'reversiones_compra',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('compra_id', sa.UUID(), nullable=False),
        sa.Column('admin_id', sa.UUID(), nullable=True),
        sa.Column('cantidad', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['compra_id'], ['compras.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['admin_id'], ['usuarios.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_reversiones_compra_compra_id', 'reversiones_compra', ['compra_id'])
    op.create_index('ix_reversiones_compra_admin_id', 'reversiones_compra', ['admin_id'])


def downgrade() -> None:
    op.drop_index('ix_reversiones_compra_admin_id', table_name='reversiones_compra')
    op.drop_index('ix_reversiones_compra_compra_id', table_name='reversiones_compra')
    op.drop_table('reversiones_compra')
