from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
from .. import schemas, models
from ..services import user_service
from ..database import engine
from ..auth import create_access_token, verify_password
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

def get_db():
    with Session(engine) as session:
        yield session

@router.post("/signup", response_model=schemas.User)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        logger.info(f"Signup attempt: {user.username}")
        
        # Validate input
        if not user.username or not user.username.strip():
            logger.warning("Signup rejected: Empty username")
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        
        if len(user.password) < 8:
            logger.warning(f"Signup rejected: Password too short for user {user.username}")
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
        db_user_by_email = user_service.get_user_by_email(db, email=user.email)
        if db_user_by_email:
            logger.warning(f"Email already registered: {user.email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        db_user_by_username = user_service.get_user_by_username(db, username=user.username)
        if db_user_by_username:
            logger.warning(f"Username already registered: {user.username}")
            raise HTTPException(status_code=400, detail="Username already registered")
        
        logger.info(f"Creating user: {user.username}")
        return user_service.create_user(db=db, user=user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        logger.info(f"Login attempt: {form_data.username}")
        
        user = user_service.get_user_by_username_or_email(db, username_or_email=form_data.username)
        if not user or not verify_password(form_data.password, user.hashed_password):
            logger.warning(f"Login failed for: {form_data.username}")
            raise HTTPException(
                status_code=400,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.info(f"Login successful: {user.username}")
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")