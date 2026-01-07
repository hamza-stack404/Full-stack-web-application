from pydantic import BaseModel, Field, EmailStr

class UserBase(BaseModel):
    username: str = Field(..., min_length=1, max_length=255)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    is_completed: bool = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
