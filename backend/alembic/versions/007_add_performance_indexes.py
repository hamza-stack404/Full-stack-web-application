"""add performance indexes

Revision ID: 007_add_performance_indexes
Revises: 006_add_account_lockout
Create Date: 2026-01-23

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '007_add_performance_indexes'
down_revision = '006_add_account_lockout'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Task table indexes for common query patterns

    # Index for filtering tasks by owner and completion status
    op.create_index(
        'idx_task_owner_completed',
        'task',
        ['owner_id', 'is_completed'],
        unique=False
    )

    # Index for filtering tasks by owner and priority
    op.create_index(
        'idx_task_owner_priority',
        'task',
        ['owner_id', 'priority'],
        unique=False
    )

    # Index for filtering tasks by owner and due date
    op.create_index(
        'idx_task_owner_due_date',
        'task',
        ['owner_id', 'due_date'],
        unique=False
    )

    # Index for filtering recurring tasks
    op.create_index(
        'idx_task_owner_recurring',
        'task',
        ['owner_id', 'is_recurring'],
        unique=False
    )

    # Index for ordering tasks by creation date
    op.create_index(
        'idx_task_owner_created',
        'task',
        ['owner_id', 'created_at'],
        unique=False
    )

    # Message table indexes for conversation queries

    # Index for retrieving messages in a conversation ordered by creation time
    op.create_index(
        'idx_message_conversation_created',
        'messages',
        ['conversation_id', 'created_at'],
        unique=False
    )

    # Index for filtering messages by role in a conversation
    op.create_index(
        'idx_message_conversation_role',
        'messages',
        ['conversation_id', 'role'],
        unique=False
    )

    # Conversation table indexes

    # Index for retrieving user conversations ordered by update time
    op.create_index(
        'idx_conversation_user_updated',
        'conversations',
        ['user_id', 'updated_at'],
        unique=False
    )

    # Index for retrieving user conversations ordered by creation time
    op.create_index(
        'idx_conversation_user_created',
        'conversations',
        ['user_id', 'created_at'],
        unique=False
    )


def downgrade() -> None:
    # Drop all indexes in reverse order

    # Conversation indexes
    op.drop_index('idx_conversation_user_created', table_name='conversations')
    op.drop_index('idx_conversation_user_updated', table_name='conversations')

    # Message indexes
    op.drop_index('idx_message_conversation_role', table_name='messages')
    op.drop_index('idx_message_conversation_created', table_name='messages')

    # Task indexes
    op.drop_index('idx_task_owner_created', table_name='task')
    op.drop_index('idx_task_owner_recurring', table_name='task')
    op.drop_index('idx_task_owner_due_date', table_name='task')
    op.drop_index('idx_task_owner_priority', table_name='task')
    op.drop_index('idx_task_owner_completed', table_name='task')
