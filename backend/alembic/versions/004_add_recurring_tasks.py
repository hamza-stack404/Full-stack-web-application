"""add recurring tasks support

Revision ID: 004_add_recurring_tasks
Revises: 003_add_tags
Create Date: 2026-01-16

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '004_add_recurring_tasks'
down_revision = '003_add_tags'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add recurring task columns to task table if they don't exist
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('task')]

    if 'is_recurring' not in columns:
        op.add_column('task', sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default='false'))
    if 'recurrence_pattern' not in columns:
        op.add_column('task', sa.Column('recurrence_pattern', sa.String(), nullable=True))
    if 'recurrence_interval' not in columns:
        op.add_column('task', sa.Column('recurrence_interval', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Remove recurring task columns from task table
    op.drop_column('task', 'recurrence_interval')
    op.drop_column('task', 'recurrence_pattern')
    op.drop_column('task', 'is_recurring')
