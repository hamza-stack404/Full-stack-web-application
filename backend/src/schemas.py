from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., min_length=1, max_length=255)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class Subtask(BaseModel):
    id: int
    title: str
    is_completed: bool = False

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    is_completed: bool = False
    priority: str = "medium"
    category: Optional[str] = None
    due_date: Optional[datetime] = None
    subtasks: Optional[List[Subtask]] = None

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

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
