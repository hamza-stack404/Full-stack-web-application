# Phase V Data Model

**Date**: 2026-02-14
**Feature**: 004-event-driven-cloud
**Status**: Complete

## Overview

Phase V extends the existing Task model with 8 new fields and introduces 2 new models (TaskEvent, AuditLog) to support event-driven architecture and audit trail functionality.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                           Task                              │
├─────────────────────────────────────────────────────────────┤
│ PK  id: Integer                                             │
│     user_id: String (indexed)                               │
│     title: String                                           │
│     description: Text                                       │
│     completed: Boolean                                      │
│     created_at: DateTime                                    │
│     updated_at: DateTime                                    │
│ --- NEW FIELDS (Phase V) ---                               │
│     priority: String (default: "medium")                    │
│     category: String (nullable)                             │
│     tags: ARRAY(String) or JSON                             │
│     due_date: DateTime (nullable, indexed)                  │
│     remind_before_minutes: Integer (default: 30)            │
│     is_recurring: Boolean (default: False, indexed)         │
│     recurrence_pattern: JSON (nullable)                     │
│ FK  parent_task_id: Integer (nullable, self-reference)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N (parent_task_id)
                              │
                              ▼
                    ┌──────────────────┐
                    │   Task (child)   │
                    └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        TaskEvent                            │
├─────────────────────────────────────────────────────────────┤
│ PK  id: Integer                                             │
│     event_id: UUID (unique, indexed)                        │
│     event_type: String (created|updated|completed|deleted)  │
│     event_version: String (default: "1.0")                  │
│ FK  task_id: Integer                                        │
│     user_id: String (indexed)                               │
│     correlation_id: UUID (indexed)                          │
│     payload: JSON                                           │
│     timestamp: DateTime (indexed)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:1
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         AuditLog                            │
├─────────────────────────────────────────────────────────────┤
│ PK  id: Integer                                             │
│ FK  event_id: UUID (references TaskEvent.event_id)          │
│ FK  task_id: Integer                                        │
│     user_id: String (indexed)                               │
│     action: String                                          │
│     changes: JSON (before/after values)                     │
│     timestamp: DateTime (indexed)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Model Definitions

### Task (Extended)

**Purpose**: Represents a user's todo item with advanced features

**SQLAlchemy Model**:

```python
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime

class Task(Base):
    __tablename__ = "tasks"

    # Existing fields (Phase I-IV)
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    completed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # NEW: Phase V fields
    priority = Column(String, default="medium", nullable=False, index=True)
    category = Column(String, nullable=True, index=True)
    tags = Column(ARRAY(String), default=list)  # PostgreSQL ARRAY
    due_date = Column(DateTime, nullable=True, index=True)
    remind_before_minutes = Column(Integer, default=30, nullable=False)
    is_recurring = Column(Boolean, default=False, index=True)
    recurrence_pattern = Column(JSON, nullable=True)
    parent_task_id = Column(Integer, ForeignKey('tasks.id'), nullable=True)

    # Relationships
    parent_task = relationship("Task", remote_side=[id], backref="child_tasks")

    # Constraints
    __table_args__ = (
        CheckConstraint(priority.in_(['low', 'medium', 'high', 'urgent']), name='valid_priority'),
        CheckConstraint(remind_before_minutes >= 0, name='positive_reminder'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "completed": self.completed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "priority": self.priority,
            "category": self.category,
            "tags": self.tags or [],
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "remind_before_minutes": self.remind_before_minutes,
            "is_recurring": self.is_recurring,
            "recurrence_pattern": self.recurrence_pattern,
            "parent_task_id": self.parent_task_id
        }
```

**Field Descriptions**:

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | Integer | No | Auto | Primary key |
| user_id | String | No | - | User identifier (from Better Auth JWT) |
| title | String | No | - | Task title |
| description | Text | Yes | NULL | Task description |
| completed | Boolean | No | False | Completion status |
| created_at | DateTime | No | now() | Creation timestamp |
| updated_at | DateTime | No | now() | Last update timestamp |
| **priority** | String | No | "medium" | Priority level: low, medium, high, urgent |
| **category** | String | Yes | NULL | Optional category for grouping |
| **tags** | ARRAY(String) | No | [] | List of tags (max 10, max 20 chars each) |
| **due_date** | DateTime | Yes | NULL | Optional deadline |
| **remind_before_minutes** | Integer | No | 30 | Minutes before due_date to send reminder |
| **is_recurring** | Boolean | No | False | Whether task repeats |
| **recurrence_pattern** | JSON | Yes | NULL | Recurrence configuration |
| **parent_task_id** | Integer | Yes | NULL | Link to original recurring task |

**Indexes**:
- `user_id` (existing)
- `completed` (existing)
- `priority` (new) - for filtering/sorting
- `due_date` (new) - for reminder queries
- `is_recurring` (new) - for recurring task queries
- `category` (new) - for filtering

**Constraints**:
- `priority` must be one of: low, medium, high, urgent
- `remind_before_minutes` must be >= 0
- `tags` array max length: 10 (enforced in application layer)
- Each tag max length: 20 characters (enforced in application layer)

---

### RecurrencePattern (JSON Schema)

**Purpose**: Defines the schedule for recurring tasks

**JSON Structure**:

```json
{
  "frequency": "daily" | "weekly" | "monthly",
  "interval": 1,
  "day_of_week": 0-6,  // Optional, for weekly (0=Sunday)
  "day_of_month": 1-31, // Optional, for monthly
  "end_date": "2026-12-31T23:59:59Z"  // Optional
}
```

**Examples**:

```json
// Daily recurrence
{
  "frequency": "daily",
  "interval": 1
}

// Every Monday (weekly)
{
  "frequency": "weekly",
  "interval": 1,
  "day_of_week": 1
}

// Every 2 weeks on Friday
{
  "frequency": "weekly",
  "interval": 2,
  "day_of_week": 5
}

// Monthly on the 15th
{
  "frequency": "monthly",
  "interval": 1,
  "day_of_month": 15
}

// Daily until end date
{
  "frequency": "daily",
  "interval": 1,
  "end_date": "2026-12-31T23:59:59Z"
}
```

**Validation Rules**:
- `frequency` is required
- `interval` must be >= 1
- `day_of_week` required if frequency=weekly (0-6)
- `day_of_month` required if frequency=monthly (1-31)
- `end_date` is optional, must be in future if provided

---

### TaskEvent

**Purpose**: Represents an event in the task lifecycle for event sourcing

**SQLAlchemy Model**:

```python
from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid

class TaskEvent(Base):
    __tablename__ = "task_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True)
    event_version = Column(String, default="1.0", nullable=False)
    task_id = Column(Integer, nullable=False, index=True)
    user_id = Column(String, nullable=False, index=True)
    correlation_id = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=False, index=True)
    payload = Column(JSON, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        CheckConstraint(event_type.in_(['created', 'updated', 'completed', 'deleted']),
                       name='valid_event_type'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": str(self.event_id),
            "event_type": self.event_type,
            "event_version": self.event_version,
            "task_id": self.task_id,
            "user_id": self.user_id,
            "correlation_id": str(self.correlation_id),
            "payload": self.payload,
            "timestamp": self.timestamp.isoformat()
        }
```

**Field Descriptions**:

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | Integer | No | Auto | Primary key |
| event_id | UUID | No | uuid4() | Unique event identifier |
| event_type | String | No | - | Event type: created, updated, completed, deleted |
| event_version | String | No | "1.0" | Event schema version |
| task_id | Integer | No | - | Task this event relates to |
| user_id | String | No | - | User who triggered the event |
| correlation_id | UUID | No | uuid4() | For tracing related events |
| payload | JSON | No | - | Full task data at time of event |
| timestamp | DateTime | No | now() | When event occurred |

**Indexes**:
- `event_id` (unique)
- `event_type`
- `task_id`
- `user_id`
- `correlation_id`
- `timestamp`

**Payload Structure**:

```json
{
  "task": {
    "id": 123,
    "user_id": "user_abc",
    "title": "Task title",
    "description": "Task description",
    "completed": false,
    "priority": "high",
    "category": "work",
    "tags": ["urgent", "backend"],
    "due_date": "2026-02-20T17:00:00Z",
    "remind_before_minutes": 60,
    "is_recurring": false,
    "recurrence_pattern": null,
    "parent_task_id": null,
    "created_at": "2026-02-14T10:00:00Z",
    "updated_at": "2026-02-14T10:00:00Z"
  },
  "changes": {  // Only for 'updated' events
    "title": {"old": "Old title", "new": "New title"},
    "priority": {"old": "medium", "new": "high"}
  }
}
```

---

### AuditLog

**Purpose**: Immutable audit trail of all task operations

**SQLAlchemy Model**:

```python
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey('task_events.event_id'),
                     nullable=False, index=True)
    task_id = Column(Integer, nullable=False, index=True)
    user_id = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)
    changes = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationship
    event = relationship("TaskEvent", backref="audit_log")

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": str(self.event_id),
            "task_id": self.task_id,
            "user_id": self.user_id,
            "action": self.action,
            "changes": self.changes,
            "timestamp": self.timestamp.isoformat()
        }
```

**Field Descriptions**:

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | Integer | No | Auto | Primary key |
| event_id | UUID | No | - | Foreign key to TaskEvent |
| task_id | Integer | No | - | Task this audit entry relates to |
| user_id | String | No | - | User who performed the action |
| action | String | No | - | Action performed (created, updated, completed, deleted) |
| changes | JSON | Yes | NULL | Before/after values for updates |
| timestamp | DateTime | No | now() | When action occurred |

**Indexes**:
- `event_id`
- `task_id`
- `user_id`
- `timestamp`

**Changes Structure** (for 'updated' action):

```json
{
  "title": {
    "old": "Old title",
    "new": "New title"
  },
  "priority": {
    "old": "medium",
    "new": "high"
  },
  "tags": {
    "old": ["tag1"],
    "new": ["tag1", "tag2"]
  }
}
```

---

## Database Migration

### Alembic Migration Script

```python
"""Phase V: Add event-driven architecture support

Revision ID: phase5_event_driven
Revises: phase4_kubernetes
Create Date: 2026-02-14

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'phase5_event_driven'
down_revision = 'phase4_kubernetes'
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns to tasks table
    op.add_column('tasks', sa.Column('priority', sa.String(),
                  server_default='medium', nullable=False))
    op.add_column('tasks', sa.Column('category', sa.String(), nullable=True))
    op.add_column('tasks', sa.Column('tags', postgresql.ARRAY(sa.String()),
                  server_default='{}', nullable=False))
    op.add_column('tasks', sa.Column('due_date', sa.DateTime(), nullable=True))
    op.add_column('tasks', sa.Column('remind_before_minutes', sa.Integer(),
                  server_default='30', nullable=False))
    op.add_column('tasks', sa.Column('is_recurring', sa.Boolean(),
                  server_default='false', nullable=False))
    op.add_column('tasks', sa.Column('recurrence_pattern', postgresql.JSON(astext_type=sa.Text()),
                  nullable=True))
    op.add_column('tasks', sa.Column('parent_task_id', sa.Integer(), nullable=True))

    # Add foreign key constraint
    op.create_foreign_key('fk_tasks_parent_task_id', 'tasks', 'tasks',
                         ['parent_task_id'], ['id'], ondelete='SET NULL')

    # Add indexes
    op.create_index('ix_tasks_priority', 'tasks', ['priority'])
    op.create_index('ix_tasks_category', 'tasks', ['category'])
    op.create_index('ix_tasks_due_date', 'tasks', ['due_date'])
    op.create_index('ix_tasks_is_recurring', 'tasks', ['is_recurring'])

    # Add check constraints
    op.create_check_constraint('valid_priority', 'tasks',
                              "priority IN ('low', 'medium', 'high', 'urgent')")
    op.create_check_constraint('positive_reminder', 'tasks',
                              'remind_before_minutes >= 0')

    # Create task_events table
    op.create_table('task_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('event_version', sa.String(), server_default='1.0', nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('correlation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('payload', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("event_type IN ('created', 'updated', 'completed', 'deleted')",
                          name='valid_event_type')
    )
    op.create_index('ix_task_events_event_id', 'task_events', ['event_id'], unique=True)
    op.create_index('ix_task_events_event_type', 'task_events', ['event_type'])
    op.create_index('ix_task_events_task_id', 'task_events', ['task_id'])
    op.create_index('ix_task_events_user_id', 'task_events', ['user_id'])
    op.create_index('ix_task_events_correlation_id', 'task_events', ['correlation_id'])
    op.create_index('ix_task_events_timestamp', 'task_events', ['timestamp'])

    # Create audit_logs table
    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('changes', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['task_events.event_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_audit_logs_event_id', 'audit_logs', ['event_id'])
    op.create_index('ix_audit_logs_task_id', 'audit_logs', ['task_id'])
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'])

def downgrade():
    # Drop audit_logs table
    op.drop_index('ix_audit_logs_timestamp', table_name='audit_logs')
    op.drop_index('ix_audit_logs_user_id', table_name='audit_logs')
    op.drop_index('ix_audit_logs_task_id', table_name='audit_logs')
    op.drop_index('ix_audit_logs_event_id', table_name='audit_logs')
    op.drop_table('audit_logs')

    # Drop task_events table
    op.drop_index('ix_task_events_timestamp', table_name='task_events')
    op.drop_index('ix_task_events_correlation_id', table_name='task_events')
    op.drop_index('ix_task_events_user_id', table_name='task_events')
    op.drop_index('ix_task_events_task_id', table_name='task_events')
    op.drop_index('ix_task_events_event_type', table_name='task_events')
    op.drop_index('ix_task_events_event_id', table_name='task_events')
    op.drop_table('task_events')

    # Drop constraints and indexes from tasks
    op.drop_constraint('positive_reminder', 'tasks', type_='check')
    op.drop_constraint('valid_priority', 'tasks', type_='check')
    op.drop_index('ix_tasks_is_recurring', table_name='tasks')
    op.drop_index('ix_tasks_due_date', table_name='tasks')
    op.drop_index('ix_tasks_category', table_name='tasks')
    op.drop_index('ix_tasks_priority', table_name='tasks')
    op.drop_constraint('fk_tasks_parent_task_id', 'tasks', type_='foreignkey')

    # Drop columns from tasks
    op.drop_column('tasks', 'parent_task_id')
    op.drop_column('tasks', 'recurrence_pattern')
    op.drop_column('tasks', 'is_recurring')
    op.drop_column('tasks', 'remind_before_minutes')
    op.drop_column('tasks', 'due_date')
    op.drop_column('tasks', 'tags')
    op.drop_column('tasks', 'category')
    op.drop_column('tasks', 'priority')
```

---

## Query Patterns

### Common Queries

**1. Get tasks by priority**:
```python
tasks = db.query(Task).filter(
    Task.user_id == user_id,
    Task.priority == 'urgent',
    Task.completed == False
).order_by(Task.due_date.asc()).all()
```

**2. Get tasks due today**:
```python
from datetime import datetime, timedelta

today_start = datetime.utcnow().replace(hour=0, minute=0, second=0)
today_end = today_start + timedelta(days=1)

tasks = db.query(Task).filter(
    Task.user_id == user_id,
    Task.due_date >= today_start,
    Task.due_date < today_end
).all()
```

**3. Get tasks with specific tag**:
```python
tasks = db.query(Task).filter(
    Task.user_id == user_id,
    Task.tags.contains(['urgent'])  # PostgreSQL ARRAY contains
).all()
```

**4. Get recurring tasks ready for next occurrence**:
```python
tasks = db.query(Task).filter(
    Task.is_recurring == True,
    Task.completed == True,
    Task.parent_task_id == None  # Only original recurring tasks
).all()
```

**5. Get audit history for a task**:
```python
audit_logs = db.query(AuditLog).filter(
    AuditLog.task_id == task_id
).order_by(AuditLog.timestamp.asc()).all()
```

**6. Search tasks by keyword**:
```python
keyword = "%search_term%"
tasks = db.query(Task).filter(
    Task.user_id == user_id,
    or_(
        Task.title.ilike(keyword),
        Task.description.ilike(keyword)
    )
).all()
```

---

## Performance Considerations

### Index Strategy
- **user_id**: Most queries filter by user → indexed
- **priority, due_date, is_recurring**: Used in filters/sorts → indexed
- **completed**: Frequently filtered → indexed
- **category**: Used in filters → indexed
- **timestamp fields**: Used in audit queries → indexed

### Query Optimization
- Use `EXPLAIN ANALYZE` to verify index usage
- Limit result sets with pagination
- Use `select_related` for foreign key relationships
- Cache frequently accessed data (Redis)

### Storage Estimates
- Task: ~500 bytes per row
- TaskEvent: ~1KB per event (includes full payload)
- AuditLog: ~500 bytes per entry

**For 10,000 users with 100 tasks each**:
- Tasks: 1M rows × 500 bytes = 500MB
- Events: 5M events × 1KB = 5GB (7-day retention)
- Audit: 5M entries × 500 bytes = 2.5GB

---

## Data Lifecycle

### Task Lifecycle
1. **Created**: Task inserted, event published
2. **Updated**: Task modified, event published with changes
3. **Completed**: Task marked complete, event published
   - If recurring: New task created automatically
4. **Deleted**: Task soft-deleted or hard-deleted, event published

### Event Retention
- **tasks.events**: 7 days in Kafka, permanent in database
- **tasks.reminders**: 24 hours in Kafka, not stored in database
- **tasks.updates**: 1 hour in Kafka, not stored in database

### Audit Retention
- **AuditLog**: Permanent storage (compliance requirement)
- Consider archiving old audit logs (>1 year) to cold storage

---

## Next Steps

1. Create contracts/api-contracts.md with REST and event schemas
2. Create quickstart.md for local development setup
3. Proceed to Phase 2: Task breakdown (`/sp.tasks`)
