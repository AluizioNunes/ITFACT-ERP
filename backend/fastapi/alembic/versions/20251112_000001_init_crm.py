"""initial CRM tables

Revision ID: 20251112_000001_init_crm
Revises: 
Create Date: 2025-11-12 00:00:01.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251112_000001_init_crm'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'leads',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('email', sa.String(length=200), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='new'),
    )
    op.create_index('ix_leads_id', 'leads', ['id'])

    op.create_table(
        'activities',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('leadId', sa.Integer(), sa.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
    )
    op.create_index('ix_activities_id', 'activities', ['id'])
    op.create_index('ix_activities_leadId', 'activities', ['leadId'])


def downgrade() -> None:
    op.drop_index('ix_activities_leadId', table_name='activities')
    op.drop_index('ix_activities_id', table_name='activities')
    op.drop_table('activities')
    op.drop_index('ix_leads_id', table_name='leads')
    op.drop_table('leads')