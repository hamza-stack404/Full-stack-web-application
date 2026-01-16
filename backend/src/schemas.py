from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., min_length=1, max_length=255)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

class User(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class Subtask(BaseModel):
    id: int
    title: str
    is_completed: bool = False
    model_config = ConfigDict(from_attributes=True)

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500, description="Task title (1-500 characters)")
    is_completed: bool = False
    priority: str = Field(default="medium", description="Task priority: low, medium, or high")
    category: Optional[str] = Field(default=None, max_length=100)
    tags: Optional[List[str]] = Field(default=None, description="List of tags for organizing tasks")
    due_date: Optional[datetime] = None
    subtasks: Optional[List[Subtask]] = None

    @field_validator('priority')
    @classmethod
    def validate_priority(cls, v: str) -> str:
        """Validate that priority is one of the allowed values"""
        allowed_priorities = ['low', 'medium', 'high']
        if v not in allowed_priorities:
            raise ValueError(f'Priority must be one of: {", ".join(allowed_priorities)}')
        return v

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Validate that title is not empty or only whitespace"""
        if not v or not v.strip():
            raise ValueError('Title cannot be empty or only whitespace')
        return v.strip()

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate tags: remove duplicates, trim whitespace, limit length"""
        if v is None:
            return None
        # Remove empty strings and trim whitespace
        cleaned_tags = [tag.strip() for tag in v if tag and tag.strip()]
        # Remove duplicates while preserving order
        seen = set()
        unique_tags = []
        for tag in cleaned_tags:
            tag_lower = tag.lower()
            if tag_lower not in seen:
                seen.add(tag_lower)
                unique_tags.append(tag)
        # Limit to 10 tags
        if len(unique_tags) > 10:
            raise ValueError('Maximum 10 tags allowed per task')
        # Limit tag length to 30 characters
        for tag in unique_tags:
            if len(tag) > 30:
                raise ValueError('Each tag must be 30 characters or less')
        return unique_tags if unique_tags else None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[datetime] = None
    subtasks: Optional[List[Subtask]] = None

class Task(TaskBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
