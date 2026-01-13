# Task T006: Add Conversation model for Phase III AI Chatbot
# Phase III: Conversation persistence - stores chat sessions
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, DateTime, func

class Conversation(SQLModel, table=True):
    """
    Conversation model for Phase III AI Chatbot.
    Stores chat sessions between users and the AI assistant.
    Each user can have multiple conversations.
    """
    __tablename__ = "conversations"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    )

    # Relationship to messages (one-to-many)
    # messages: List["Message"] = Relationship(back_populates="conversation")
