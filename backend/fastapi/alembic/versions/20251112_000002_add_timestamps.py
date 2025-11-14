"""add created_at timestamps

Revision ID: 20251112_000002_add_timestamps
Revises: 20251112_000001_init_crm
Create Date: 2025-11-12 00:10:01.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251112_000002_add_timestamps'
down_revision = '20251112_000001_init_crm'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('leads', sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False))
    op.add_column('activities', sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False))


def downgrade() -> None:
    op.drop_column('activities', 'created_at')
    op.drop_column('leads', 'created_at')