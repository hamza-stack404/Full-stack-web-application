from sqlmodel import Field, SQLModel
from datetime import datetime, UTC
from typing import Optional
from sqlalchemy import Column, DateTime, func, JSON
from uuid import UUID, uuid4

class TaskEvent(SQLModel, table=True):
    """Event sourcing model for task lifecycle events"""
    __tablename__ = "task_events"

    id: int | None = Field(default=None, primary_key=True)
    event_id: UUID = Field(default_factory=uuid4, unique=True, index=True)
    event_type: str = Field(index=True)  # created, updated, completed, deleted
    event_version: str = Field(default="1.0")
    task_id: int = Field(foreign_key="task.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    correlation_id: UUID = Field(default_factory=uuid4, index=True)
    payload: dict = Field(sa_column=Column(JSON))  # Full task data at time of event
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), index=True)
    )
