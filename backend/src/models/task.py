from sqlmodel import Field, SQLModel
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, DateTime, func

class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    is_completed: bool = False
    priority: str = "medium"
    due_date: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True), server_default=func.now()))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()))
    owner_id: int | None = Field(default=None, foreign_key="users.id") # Corrected foreign key