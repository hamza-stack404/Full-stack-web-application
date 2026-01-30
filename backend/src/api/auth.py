from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
from .. import schemas, models
from ..services import user_service
from ..database import get_db
from ..auth import create_access_token, verify_password, get_current_user
from ..utils import validate_password_strength, validate_email_format, validate_username
from ..sanitization import sanitize_username, sanitize_email
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/signup", response_model=schemas.User)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        logger.info(f"Signup attempt: {user.username}")

        # Sanitize inputs first to prevent XSS
        sanitized_username = sanitize_username(user.username)
        sanitized_email = sanitize_email(user.email)

        # Check if sanitization removed too much
        if not sanitized_username or len(sanitized_username) < 1:
            raise HTTPException(status_code=400, detail="Invalid username format")

        if not sanitized_email or '@' not in sanitized_email:
            raise HTTPException(status_code=400, detail="Invalid email format")

        # Create sanitized user object
        sanitized_user = schemas.UserCreate(
            username=sanitized_username,
            email=sanitized_email,
            password=user.password  # Password is hashed, not sanitized
        )

        # Validate username
        is_valid, error_msg = validate_username(sanitized_user.username)
        if not is_valid:
            logger.warning(f"Signup rejected: Invalid username - {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)

        # Validate email format
        is_valid, error_msg = validate_email_format(sanitized_user.email)
        if not is_valid:
            logger.warning(f"Signup rejected: Invalid email - {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)

        # Validate password strength
        is_valid, error_msg = validate_password_strength(sanitized_user.password)
        if not is_valid:
            logger.warning(f"Signup rejected: Weak password for user {sanitized_user.username}")
            raise HTTPException(status_code=400, detail=error_msg)

        db_user_by_email = user_service.get_user_by_email(db, email=sanitized_user.email)
        if db_user_by_email:
            logger.warning(f"Email already registered: {sanitized_user.email}")
            raise HTTPException(status_code=400, detail="Email already registered")

        db_user_by_username = user_service.get_user_by_username(db, username=sanitized_user.username)
        if db_user_by_username:
            logger.warning(f"Username already registered: {sanitized_user.username}")
            raise HTTPException(status_code=400, detail="Username already registered")

        logger.info(f"Creating user: {sanitized_user.username}")
        result = user_service.create_user(db=db, user=sanitized_user)
        
        # Return as schemas.User instance
        return schemas.User(
            id=result["id"],
            username=result["username"],
            email=result["email"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@router.post("/login", response_model=schemas.LoginResponse)
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Login attempt: {form_data.username}")

        user = user_service.get_user_by_username_or_email(db, username_or_email=form_data.username)

        # Check if user exists
        if not user:
            logger.warning(f"Login failed - user not found: {form_data.username}")
            raise HTTPException(
                status_code=400,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if account is locked
        if user_service.is_account_locked(user):
            from datetime import datetime, UTC
            minutes_remaining = int((user.locked_until - datetime.now(UTC)).total_seconds() / 60) + 1
            logger.warning(f"Login attempt on locked account: {user.username}")
            raise HTTPException(
                status_code=403,
                detail=f"Account is locked due to multiple failed login attempts. Please try again in {minutes_remaining} minutes.",
            )

        # Verify password
        if not verify_password(form_data.password, user.hashed_password):
            logger.warning(f"Login failed - incorrect password for: {form_data.username}")
            user_service.record_failed_login(db, user)

            # Check if account just got locked
            if user.failed_login_attempts >= 5:
                raise HTTPException(
                    status_code=403,
                    detail="Account has been locked due to multiple failed login attempts. Please try again in 15 minutes.",
                )

            remaining_attempts = 5 - user.failed_login_attempts
            raise HTTPException(
                status_code=400,
                detail=f"Incorrect username or password. {remaining_attempts} attempts remaining before account lockout.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Successful login - reset failed attempts
        user_service.reset_failed_login_attempts(db, user)

        logger.info(f"Login successful: {user.username}")
        from datetime import timedelta
        from ..auth import ACCESS_TOKEN_EXPIRE_MINUTES, create_refresh_token, store_refresh_token, REFRESH_TOKEN_EXPIRE_DAYS

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=access_token_expires
        )

        # Create and store refresh token
        refresh_token = create_refresh_token()
        store_refresh_token(db, user.id, refresh_token)

        # Set httpOnly cookie for security
        is_production = os.getenv("ENVIRONMENT", "development") == "production"
        response.set_cookie(
            key="access_token",
            value=f"Bearer {access_token}",
            httponly=True,
            secure=is_production,  # Only HTTPS in production
            samesite="lax",  # CSRF protection
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        )

        # Set refresh token cookie
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=is_production,
            samesite="lax",
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,  # Convert to seconds
        )

        # Return success message only (token is in httpOnly cookie)
        # DO NOT return the token in response body - it defeats httpOnly security
        return {
            "message": "Login successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.post("/logout")
def logout(response: Response, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Logout user by clearing cookies and revoking refresh token"""
    from ..auth import revoke_refresh_token

    # Revoke refresh token in database
    revoke_refresh_token(db, current_user.id)

    # Clear cookies
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")

    return {"message": "Logged out successfully"}

@router.post("/refresh", response_model=schemas.RefreshResponse)
def refresh_access_token(
    response: Response,
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    from ..auth import validate_refresh_token, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
    from datetime import timedelta

    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail="Refresh token not provided"
        )

    # Validate refresh token
    user = validate_refresh_token(db, refresh_token)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token"
        )

    # Create new access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )

    # Set new access token cookie
    is_production = os.getenv("ENVIRONMENT", "development") == "production"
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    # Return success message only (token is in httpOnly cookie)
    return {"message": "Token refreshed successfully"}