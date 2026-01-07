from sqlmodel import Session, select
from .. import models, schemas
from ..auth import get_password_hash

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
