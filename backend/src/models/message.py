# Task T007: Add Message model for Phase III AI Chatbot
# Phase III: Conversation persistence - stores individual messages
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from typing import Optional, Literal
from sqlalchemy import Column, DateTime, func, Text

class Message(SQLModel, table=True):
    """
    Message model for Phase III AI Chatbot.
    Stores individual messages within a conversation.
    Role can be 'user' (user input) or 'assistant' (AI response).
    """
    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    role: str = Field(...)  # "user" or "assistant"
    content: str = Field(sa_column=Column(Text))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), index=True)
    )

    # Relationship to conversation (many-to-one)
    # conversation: Optional["Conversation"] = Relationship(back_populates="messages")
