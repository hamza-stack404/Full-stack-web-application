from sqlmodel import Field, SQLModel
from datetime import datetime, UTC
from typing import Optional
from sqlalchemy import Column, DateTime, func, JSON

class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    is_completed: bool = False
    priority: str = "medium"
    category: Optional[str] = Field(default=None)
    tags: Optional[list] = Field(default=None, sa_column=Column(JSON))
    due_date: Optional[datetime] = Field(default=None)
    subtasks: Optional[list] = Field(default=None, sa_column=Column(JSON))
    is_recurring: bool = Field(default=False)
    recurrence_pattern: Optional[str] = Field(default=None)  # "daily", "weekly", "monthly"
    recurrence_interval: Optional[int] = Field(default=1)  # Every N days/weeks/months
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), sa_column=Column(DateTime(timezone=True), server_default=func.now()))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC), sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()))
    owner_id: int | None = Field(default=None, foreign_key="users.id", ondelete="CASCADE")