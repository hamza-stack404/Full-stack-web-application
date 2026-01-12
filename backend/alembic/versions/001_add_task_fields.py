"""Add category and subtasks fields to task table

Revision ID: 001_add_task_fields
Revises:
Create Date: 2026-01-12

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_add_task_fields'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add category column
    op.add_column('task', sa.Column('category', sa.String(), nullable=True))

    # Add subtasks column as JSON
    op.add_column('task', sa.Column('subtasks', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade():
    # Remove the columns if we need to rollback
    op.drop_column('task', 'subtasks')
    op.drop_column('task', 'category')
