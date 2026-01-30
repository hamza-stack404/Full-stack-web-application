"""add account lockout fields

Revision ID: 006_add_account_lockout
Revises: 005_add_cascade_deletes
Create Date: 2026-01-23

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '006_add_account_lockout'
down_revision = '005_add_cascade_deletes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add account lockout fields to users table if they don't exist
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]

    if 'failed_login_attempts' not in columns:
        op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default='0'))
    if 'locked_until' not in columns:
        op.add_column('users', sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Remove account lockout fields from users table
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'failed_login_attempts')
