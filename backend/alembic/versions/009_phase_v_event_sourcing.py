"""Phase V: Event sourcing and audit trail

Revision ID: 009_phase_v_event_sourcing
Revises: 008_add_refresh_tokens
Create Date: 2026-02-14

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '009_phase_v_event_sourcing'
down_revision = '008_add_refresh_tokens'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to task table
    op.add_column('task', sa.Column('remind_before_minutes', sa.Integer(), nullable=False, server_default='30'))
    op.add_column('task', sa.Column('parent_task_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_task_parent_task_id', 'task', 'task', ['parent_task_id'], ['id'])

    # Alter recurrence_pattern column type from String to JSON
    op.alter_column('task', 'recurrence_pattern',
                    existing_type=sa.String(),
                    type_=sa.JSON(),
                    existing_nullable=True)

    # Create task_events table
    op.create_table('task_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('event_version', sa.String(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('correlation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['task.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_id')
    )
    op.create_index(op.f('ix_task_events_event_id'), 'task_events', ['event_id'], unique=True)
    op.create_index(op.f('ix_task_events_event_type'), 'task_events', ['event_type'], unique=False)
    op.create_index(op.f('ix_task_events_task_id'), 'task_events', ['task_id'], unique=False)
    op.create_index(op.f('ix_task_events_user_id'), 'task_events', ['user_id'], unique=False)
    op.create_index(op.f('ix_task_events_correlation_id'), 'task_events', ['correlation_id'], unique=False)
    op.create_index(op.f('ix_task_events_timestamp'), 'task_events', ['timestamp'], unique=False)

    # Create audit_logs table
    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('changes', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['task_events.event_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_event_id'), 'audit_logs', ['event_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_task_id'), 'audit_logs', ['task_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_timestamp'), 'audit_logs', ['timestamp'], unique=False)


def downgrade() -> None:
    # Drop audit_logs table
    op.drop_index(op.f('ix_audit_logs_timestamp'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_user_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_task_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_event_id'), table_name='audit_logs')
    op.drop_table('audit_logs')

    # Drop task_events table
    op.drop_index(op.f('ix_task_events_timestamp'), table_name='task_events')
    op.drop_index(op.f('ix_task_events_correlation_id'), table_name='task_events')
    op.drop_index(op.f('ix_task_events_user_id'), table_name='task_events')
    op.drop_index(op.f('ix_task_events_task_id'), table_name='task_events')
    op.drop_index(op.f('ix_task_events_event_type'), table_name='task_events')
    op.drop_index(op.f('ix_task_events_event_id'), table_name='task_events')
    op.drop_table('task_events')

    # Revert task table changes
    op.alter_column('task', 'recurrence_pattern',
                    existing_type=sa.JSON(),
                    type_=sa.String(),
                    existing_nullable=True)
    op.drop_constraint('fk_task_parent_task_id', 'task', type_='foreignkey')
    op.drop_column('task', 'parent_task_id')
    op.drop_column('task', 'remind_before_minutes')
