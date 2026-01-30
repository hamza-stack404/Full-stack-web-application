"""add cascade deletes to foreign keys

Revision ID: 005_add_cascade_deletes
Revises: 004_add_recurring_tasks
Create Date: 2026-01-23

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005_add_cascade_deletes'
down_revision = '004_add_recurring_tasks'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop existing foreign key constraints and recreate with CASCADE

    # Task table - owner_id foreign key
    op.drop_constraint('task_owner_id_fkey', 'task', type_='foreignkey')
    op.create_foreign_key(
        'task_owner_id_fkey',
        'task',
        'users',
        ['owner_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # Conversation table - user_id foreign key
    op.drop_constraint('conversations_user_id_fkey', 'conversations', type_='foreignkey')
    op.create_foreign_key(
        'conversations_user_id_fkey',
        'conversations',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # Message table - conversation_id foreign key
    op.drop_constraint('messages_conversation_id_fkey', 'messages', type_='foreignkey')
    op.create_foreign_key(
        'messages_conversation_id_fkey',
        'messages',
        'conversations',
        ['conversation_id'],
        ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Revert to foreign keys without CASCADE

    # Message table
    op.drop_constraint('messages_conversation_id_fkey', 'messages', type_='foreignkey')
    op.create_foreign_key(
        'messages_conversation_id_fkey',
        'messages',
        'conversations',
        ['conversation_id'],
        ['id']
    )

    # Conversation table
    op.drop_constraint('conversations_user_id_fkey', 'conversations', type_='foreignkey')
    op.create_foreign_key(
        'conversations_user_id_fkey',
        'conversations',
        'users',
        ['user_id'],
        ['id']
    )

    # Task table
    op.drop_constraint('task_owner_id_fkey', 'task', type_='foreignkey')
    op.create_foreign_key(
        'task_owner_id_fkey',
        'task',
        'users',
        ['owner_id'],
        ['id']
    )
