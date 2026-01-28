"""
CSRF Protection Middleware
Implements Double Submit Cookie pattern for CSRF protection
"""

import secrets
import hmac
import hashlib
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging
import os

logger = logging.getLogger(__name__)

# CSRF token configuration
CSRF_TOKEN_LENGTH = 32
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_COOKIE_NAME = "csrf_token"

# Methods that require CSRF protection
CSRF_PROTECTED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Paths that are exempt from CSRF protection
CSRF_EXEMPT_PATHS = {
    "/api/login",      # Login needs to work without existing token
    "/api/signup",     # Signup needs to work without existing token
    "/api/refresh",    # Token refresh needs to work without CSRF
    "/docs",           # API documentation
    "/openapi.json",   # OpenAPI schema
    "/health",         # Health check
}


def generate_csrf_token() -> str:
    """Generate a cryptographically secure CSRF token"""
    return secrets.token_urlsafe(CSRF_TOKEN_LENGTH)


def create_csrf_signature(token: str, secret: str) -> str:
    """Create HMAC signature for CSRF token validation"""
    return hmac.new(
        secret.encode(),
        token.encode(),
        hashlib.sha256
    ).hexdigest()


def validate_csrf_token(token: str, signature: str, secret: str) -> bool:
    """Validate CSRF token against its signature"""
    expected_signature = create_csrf_signature(token, secret)
    return hmac.compare_digest(expected_signature, signature)


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF Protection Middleware using Double Submit Cookie pattern

    How it works:
    1. On login/signup, generate a CSRF token and set it in a non-httpOnly cookie
    2. Frontend reads the cookie and includes it in X-CSRF-Token header
    3. Backend validates that header matches cookie for state-changing requests
    """

    def __init__(self, app, secret_key: str):
        super().__init__(app)
        self.secret_key = secret_key

    async def dispatch(self, request: Request, call_next):
        # Check if this path is exempt from CSRF protection
        if any(request.url.path.startswith(path) for path in CSRF_EXEMPT_PATHS):
            response = await call_next(request)
            return response

        # Only protect state-changing methods
        if request.method in CSRF_PROTECTED_METHODS:
            # Get CSRF token from cookie
            csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)

            # Get CSRF token from header
            csrf_header = request.headers.get(CSRF_HEADER_NAME)

            # Both must be present
            if not csrf_cookie or not csrf_header:
                logger.warning(f"CSRF validation failed: Missing token (cookie={bool(csrf_cookie)}, header={bool(csrf_header)})")
                raise HTTPException(
                    status_code=403,
                    detail="CSRF token missing. Please refresh the page and try again."
                )

            # Tokens must match (Double Submit Cookie pattern)
            if not hmac.compare_digest(csrf_cookie, csrf_header):
                logger.warning("CSRF validation failed: Token mismatch")
                raise HTTPException(
                    status_code=403,
                    detail="CSRF token validation failed. Please refresh the page and try again."
                )

            logger.debug(f"CSRF validation passed for {request.method} {request.url.path}")

        # Process the request
        response = await call_next(request)

        # Add CSRF token to response if not present
        # This ensures new sessions get a token
        if CSRF_COOKIE_NAME not in request.cookies:
            csrf_token = generate_csrf_token()
            is_production = os.getenv("ENVIRONMENT", "development") == "production"

            response.set_cookie(
                key=CSRF_COOKIE_NAME,
                value=csrf_token,
                httponly=False,  # Must be readable by JavaScript
                secure=is_production,  # Only HTTPS in production
                samesite="strict",  # Strict for CSRF token
                max_age=24 * 60 * 60,  # 24 hours
            )

            logger.debug("Generated new CSRF token")

        return response


def set_csrf_token_cookie(response: Response, token: str = None) -> str:
    """
    Helper function to set CSRF token cookie on response
    Returns the token that was set
    """
    if token is None:
        token = generate_csrf_token()

    is_production = os.getenv("ENVIRONMENT", "development") == "production"

    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=token,
        httponly=False,  # Must be readable by JavaScript
        secure=is_production,
        samesite="strict",
        max_age=24 * 60 * 60,  # 24 hours
    )

    return token
