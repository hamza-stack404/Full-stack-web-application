"""add tags to tasks

Revision ID: 003_add_tags
Revises: 0249bf906e7d
Create Date: 2026-01-16

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_add_tags'
down_revision = '0249bf906e7d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add tags column to task table
    op.add_column('task', sa.Column('tags', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    # Remove tags column from task table
    op.drop_column('task', 'tags')
