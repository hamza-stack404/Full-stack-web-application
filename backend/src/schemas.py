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
