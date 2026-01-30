from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta, UTC
import os
import secrets
from dotenv import load_dotenv
from sqlmodel import Session
from .database import engine, get_db
from . import services
from typing import Optional

load_dotenv()

SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")
if not SECRET_KEY:
    raise ValueError(
        "BETTER_AUTH_SECRET environment variable must be set. "
        "Please add it to your .env file or environment variables."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login", auto_error=False)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token() -> str:
    """Generate a secure random refresh token"""
    return secrets.token_urlsafe(32)

def store_refresh_token(db: Session, user_id: int, refresh_token: str) -> None:
    """Store refresh token in database with expiration"""
    from .models.user import User
    from sqlmodel import select

    statement = select(User).where(User.id == user_id)
    user = db.exec(statement).first()

    if user:
        user.refresh_token = refresh_token
        user.refresh_token_expires_at = datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        db.add(user)
        db.commit()

def validate_refresh_token(db: Session, refresh_token: str):
    """Validate refresh token and return user if valid"""
    from .models.user import User
    from sqlmodel import select

    statement = select(User).where(User.refresh_token == refresh_token)
    user = db.exec(statement).first()

    if not user:
        return None

    # Check if token is expired
    if user.refresh_token_expires_at and user.refresh_token_expires_at < datetime.now(UTC):
        # Token expired, clear it
        user.refresh_token = None
        user.refresh_token_expires_at = None
        db.add(user)
        db.commit()
        return None

    return user

def revoke_refresh_token(db: Session, user_id: int) -> None:
    """Revoke user's refresh token"""
    from .models.user import User
    from sqlmodel import select

    statement = select(User).where(User.id == user_id)
    user = db.exec(statement).first()

    if user:
        user.refresh_token = None
        user.refresh_token_expires_at = None
        db.add(user)
        db.commit()

def get_current_user(
    access_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Get current user from either cookie or Authorization header.
    Supports both httpOnly cookie (preferred) and Bearer token (backward compatibility).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Try to get token from cookie first (preferred method)
    token = None
    if access_token:
        # Remove "Bearer " prefix if present
        token = access_token.replace("Bearer ", "")
    elif authorization:
        # Fallback to Authorization header for backward compatibility
        token = authorization

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = services.user_service.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user
