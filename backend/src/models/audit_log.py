from sqlmodel import Field, SQLModel
from datetime import datetime, UTC
from typing import Optional
from sqlalchemy import Column, DateTime, func, JSON
from uuid import UUID

class AuditLog(SQLModel, table=True):
    """Immutable audit trail for all task operations"""
    __tablename__ = "audit_logs"

    id: int | None = Field(default=None, primary_key=True)
    event_id: UUID = Field(foreign_key="task_events.event_id", index=True)
    task_id: int = Field(index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    action: str  # created, updated, completed, deleted
    changes: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # Before/after values for updates
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), index=True)
    )
