"""add refresh token fields

Revision ID: 008_add_refresh_tokens
Revises: 007_add_performance_indexes
Create Date: 2026-01-23

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '008_add_refresh_tokens'
down_revision = '007_add_performance_indexes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add refresh token fields to users table if they don't exist
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    indexes = [idx['name'] for idx in inspector.get_indexes('users')]

    if 'refresh_token' not in columns:
        op.add_column('users', sa.Column('refresh_token', sa.String(), nullable=True))
    if 'refresh_token_expires_at' not in columns:
        op.add_column('users', sa.Column('refresh_token_expires_at', sa.DateTime(timezone=True), nullable=True))

    # Add index on refresh_token for faster lookups
    if 'idx_users_refresh_token' not in indexes:
        op.create_index('idx_users_refresh_token', 'users', ['refresh_token'], unique=False)


def downgrade() -> None:
    # Remove index and columns
    op.drop_index('idx_users_refresh_token', table_name='users')
    op.drop_column('users', 'refresh_token_expires_at')
    op.drop_column('users', 'refresh_token')
