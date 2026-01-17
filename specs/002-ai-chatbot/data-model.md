# Data Model: AI Chatbot for Todo Management

**Feature**: 002-ai-chatbot
**Date**: 2026-01-13
**Purpose**: Define database schema for Phase III conversation and message storage

## Overview

Phase III extends the existing Phase II database with two new tables to support conversational AI interactions. These tables store chat conversations and individual messages while maintaining strict user isolation.

## Existing Phase II Entities (No Changes)

### User
- **Purpose**: Represents application users (existing from Phase II)
- **No modifications required**
- **Referenced by**: Conversation (new foreign key)

### Task
- **Purpose**: Represents todo items (existing from Phase II)
- **No modifications required**
- **Accessed by**: MCP tools via existing Phase II logic

## New Phase III Entities

### Conversation

**Purpose**: Groups related messages into a conversation session between a user and the AI assistant.

**Attributes**:
- `id` (integer, primary key, auto-increment): Unique conversation identifier
- `user_id` (string, foreign key → users.id, indexed, not null): Owner of the conversation
- `created_at` (datetime, not null): When conversation was started
- `updated_at` (datetime, not null): Last message timestamp

**Relationships**:
- Belongs to one User (many-to-one)
- Has many Messages (one-to-many)

**Constraints**:
- `user_id` must reference existing user
- `updated_at` >= `created_at`
- Index on `user_id` for fast user conversation queries
- Index on `updated_at` for sorting by recency

**Business Rules**:
- A user can have multiple conversations
- Conversations are never deleted (soft delete if needed in future)
- `updated_at` is updated whenever a new message is added

**SQLModel Definition**:
```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List

class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    messages: List["Message"] = Relationship(back_populates="conversation")
```

---

### Message

**Purpose**: Stores individual messages within a conversation, including both user inputs and AI assistant responses.

**Attributes**:
- `id` (integer, primary key, auto-increment): Unique message identifier
- `conversation_id` (integer, foreign key → conversations.id, indexed, not null): Parent conversation
- `role` (string, not null): Message sender - "user" or "assistant"
- `content` (text, not null): Message text content
- `created_at` (datetime, not null): When message was created

**Relationships**:
- Belongs to one Conversation (many-to-one)

**Constraints**:
- `conversation_id` must reference existing conversation
- `role` must be either "user" or "assistant"
- `content` cannot be empty
- Index on `conversation_id` for fast conversation message queries
- Index on `created_at` for chronological ordering

**Business Rules**:
- Messages are immutable once created (no updates)
- Messages are ordered chronologically within a conversation
- User messages and assistant responses alternate (enforced at application level)
- Messages are never deleted (conversation history is permanent)

**SQLModel Definition**:
```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, Literal

class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    role: Literal["user", "assistant"] = Field(...)
    content: str = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    conversation: Optional[Conversation] = Relationship(back_populates="messages")
```

---

## Entity Relationships Diagram

```
┌─────────────────┐
│     User        │
│  (Phase II)     │
│─────────────────│
│ id (PK)         │
│ email           │
│ hashed_password │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│  Conversation   │
│  (Phase III)    │
│─────────────────│
│ id (PK)         │
│ user_id (FK)    │◄─── Indexed
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│    Message      │
│  (Phase III)    │
│─────────────────│
│ id (PK)         │
│ conversation_id │◄─── Indexed
│ role            │
│ content         │
│ created_at      │◄─── Indexed
└─────────────────┘

┌─────────────────┐
│      Task       │
│  (Phase II)     │
│─────────────────│
│ id (PK)         │
│ user_id (FK)    │
│ title           │
│ is_completed    │
│ owner_id        │
└─────────────────┘
  ▲
  │
  │ Accessed via MCP tools
  │ (no direct relationship)
```

---

## Database Migration

### Migration Script (Alembic)

**File**: `backend/alembic/versions/002_add_conversation_tables.py`

```python
"""Add conversation and message tables for Phase III

Revision ID: 002
Revises: 001
Create Date: 2026-01-13
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    # Create conversations table
    op.create_table(
        'conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_conversations_user_id', 'conversations', ['user_id'])
    op.create_index('ix_conversations_updated_at', 'conversations', ['updated_at'])

    # Create messages table
    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("role IN ('user', 'assistant')", name='check_message_role')
    )
    op.create_index('ix_messages_conversation_id', 'messages', ['conversation_id'])
    op.create_index('ix_messages_created_at', 'messages', ['created_at'])

def downgrade():
    op.drop_index('ix_messages_created_at', table_name='messages')
    op.drop_index('ix_messages_conversation_id', table_name='messages')
    op.drop_table('messages')

    op.drop_index('ix_conversations_updated_at', table_name='conversations')
    op.drop_index('ix_conversations_user_id', table_name='conversations')
    op.drop_table('conversations')
```

---

## Data Access Patterns

### Pattern 1: Create New Conversation
**Use Case**: User starts a new chat session

```python
async def create_conversation(user_id: str) -> Conversation:
    conversation = Conversation(
        user_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    session.add(conversation)
    await session.commit()
    await session.refresh(conversation)
    return conversation
```

**Query**: `INSERT INTO conversations (user_id, created_at, updated_at) VALUES (?, ?, ?)`

---

### Pattern 2: Add Message to Conversation
**Use Case**: User sends message or AI responds

```python
async def add_message(
    conversation_id: int,
    role: Literal["user", "assistant"],
    content: str
) -> Message:
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        created_at=datetime.utcnow()
    )
    session.add(message)

    # Update conversation timestamp
    conversation = await session.get(Conversation, conversation_id)
    conversation.updated_at = datetime.utcnow()

    await session.commit()
    await session.refresh(message)
    return message
```

**Queries**:
- `INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)`
- `UPDATE conversations SET updated_at = ? WHERE id = ?`

---

### Pattern 3: Load Conversation History
**Use Case**: Retrieve messages for AI context

```python
async def get_conversation_history(
    conversation_id: int,
    limit: int = 50
) -> List[Message]:
    statement = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    result = await session.execute(statement)
    messages = result.scalars().all()
    return list(reversed(messages))  # Return chronological order
```

**Query**: `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?`

**Performance**: Uses `ix_messages_conversation_id` and `ix_messages_created_at` indexes

---

### Pattern 4: Get User's Conversations
**Use Case**: List user's conversation history

```python
async def get_user_conversations(
    user_id: str,
    limit: int = 20
) -> List[Conversation]:
    statement = (
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
        .limit(limit)
    )
    result = await session.execute(statement)
    return result.scalars().all()
```

**Query**: `SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?`

**Performance**: Uses `ix_conversations_user_id` and `ix_conversations_updated_at` indexes

---

### Pattern 5: Get or Create Conversation
**Use Case**: Resume existing conversation or start new one

```python
async def get_or_create_conversation(
    user_id: str,
    conversation_id: Optional[int] = None
) -> Conversation:
    if conversation_id:
        # Verify conversation belongs to user
        statement = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        )
        result = await session.execute(statement)
        conversation = result.scalar_one_or_none()

        if conversation:
            return conversation
        else:
            raise ValueError("Conversation not found or access denied")

    # Create new conversation
    return await create_conversation(user_id)
```

---

## Validation Rules

### Conversation Validation
1. `user_id` must exist in users table
2. `created_at` and `updated_at` must be valid timestamps
3. `updated_at` must be >= `created_at`
4. User can only access their own conversations

### Message Validation
1. `conversation_id` must exist in conversations table
2. `role` must be exactly "user" or "assistant"
3. `content` cannot be empty or whitespace-only
4. `created_at` must be valid timestamp
5. Messages can only be added to conversations owned by the authenticated user

---

## Performance Considerations

### Indexes
- **conversations.user_id**: Fast lookup of user's conversations
- **conversations.updated_at**: Efficient sorting by recency
- **messages.conversation_id**: Fast retrieval of conversation messages
- **messages.created_at**: Chronological ordering

### Query Optimization
- Limit conversation history to last 50 messages (prevents large context)
- Use pagination for older messages if needed
- Async queries prevent blocking
- Connection pooling (existing Phase II configuration)

### Estimated Storage
- Conversation: ~50 bytes per row
- Message: ~500 bytes per row (average)
- 1000 users × 10 conversations × 100 messages = 500 MB
- Indexes add ~20% overhead

---

## Security Considerations

### User Isolation
- All queries filter by `user_id` from JWT
- Foreign key constraints enforce referential integrity
- Application-level validation before database operations

### Data Privacy
- Conversations and messages are private to each user
- No cross-user access possible
- Audit logging for compliance (future enhancement)

---

## Testing Strategy

### Unit Tests
- Test model creation and validation
- Test relationship integrity
- Test constraint violations

### Integration Tests
- Test conversation creation flow
- Test message addition with conversation update
- Test conversation history retrieval
- Test user isolation (attempt cross-user access)

### Performance Tests
- Benchmark conversation history query with 1000 messages
- Test concurrent message additions
- Verify index usage with EXPLAIN ANALYZE

---

## Future Enhancements (Out of Scope for Phase III)

1. **Conversation Titles**: Auto-generate titles from first message
2. **Conversation Archiving**: Soft delete old conversations
3. **Message Metadata**: Store tool calls, tokens used, response time
4. **Full-Text Search**: Search across conversation history
5. **Conversation Sharing**: Share conversations between users (with permission)
6. **Message Reactions**: Allow users to rate AI responses
