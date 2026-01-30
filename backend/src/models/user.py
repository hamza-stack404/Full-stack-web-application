from sqlmodel import Field, SQLModel
from datetime import datetime
from typing import Optional

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    failed_login_attempts: int = Field(default=0)
    locked_until: Optional[datetime] = Field(default=None)
    refresh_token: Optional[str] = Field(default=None, index=True)
    refresh_token_expires_at: Optional[datetime] = Field(default=None)
