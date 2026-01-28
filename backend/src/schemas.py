from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import Optional, List, Generic, TypeVar
from datetime import datetime

# Generic type for pagination
T = TypeVar('T')

class PaginationMetadata(BaseModel):
    """Pagination metadata for list responses"""
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number (1-indexed)")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_prev: bool = Field(..., description="Whether there is a previous page")

class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper"""
    items: List[T] = Field(..., description="List of items for current page")
    pagination: PaginationMetadata = Field(..., description="Pagination metadata")

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
    is_recurring: bool = Field(default=False, description="Whether this task repeats")
    recurrence_pattern: Optional[str] = Field(default=None, description="Recurrence pattern: daily, weekly, or monthly")
    recurrence_interval: Optional[int] = Field(default=1, ge=1, le=365, description="Repeat every N days/weeks/months")

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

    @field_validator('recurrence_pattern')
    @classmethod
    def validate_recurrence_pattern(cls, v: Optional[str], info) -> Optional[str]:
        """Validate recurrence pattern"""
        if v is None:
            return None
        allowed_patterns = ['daily', 'weekly', 'monthly']
        if v not in allowed_patterns:
            raise ValueError(f'Recurrence pattern must be one of: {", ".join(allowed_patterns)}')
        return v

    @field_validator('recurrence_interval')
    @classmethod
    def validate_recurrence_interval(cls, v: Optional[int], info) -> Optional[int]:
        """Validate recurrence interval"""
        if v is None:
            return None
        if v < 1 or v > 365:
            raise ValueError('Recurrence interval must be between 1 and 365')
        return v

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

class LoginResponse(BaseModel):
    """Response for successful login (token is in httpOnly cookie)"""
    message: str
    user: User

class RefreshResponse(BaseModel):
    """Response for successful token refresh (token is in httpOnly cookie)"""
    message: str
