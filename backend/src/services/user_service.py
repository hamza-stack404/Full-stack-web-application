from sqlmodel import Session, select
from .. import models, schemas
from ..auth import get_password_hash
from datetime import datetime, timedelta, UTC

def get_user_by_email(db: Session, email: str):
    statement = select(models.User).where(models.User.email == email)
    return db.exec(statement).first()

def get_user_by_username(db: Session, username: str):
    statement = select(models.User).where(models.User.username == username)
    return db.exec(statement).first()

def get_user_by_username_or_email(db: Session, username_or_email: str):
    statement = select(models.User).where(
        (models.User.username == username_or_email) | (models.User.email == username_or_email)
    )
    return db.exec(statement).first()

def is_account_locked(user: models.User) -> bool:
    """Check if user account is currently locked"""
    if user.locked_until is None:
        return False
    return datetime.now(UTC) < user.locked_until

def record_failed_login(db: Session, user: models.User) -> None:
    """Record a failed login attempt and lock account if threshold exceeded"""
    user.failed_login_attempts += 1

    # Lock account for 15 minutes after 5 failed attempts
    if user.failed_login_attempts >= 5:
        user.locked_until = datetime.now(UTC) + timedelta(minutes=15)

    db.add(user)
    db.commit()
    db.refresh(user)

def reset_failed_login_attempts(db: Session, user: models.User) -> None:
    """Reset failed login attempts after successful login"""
    user.failed_login_attempts = 0
    user.locked_until = None
    db.add(user)
    db.commit()
    db.refresh(user)

def create_user(db: Session, user: schemas.UserCreate):
    from ..auth import get_password_hash

    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    try:
        db.add(db_user)
        db.commit()
        # Get values before closing session
        user_data = {
            "id": db_user.id,
            "username": db_user.username,
            "email": db_user.email
        }
        return user_data
    except Exception as e:
        db.rollback()
        raise
