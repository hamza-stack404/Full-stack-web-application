from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from sqlalchemy import text
import logging
import os
import time
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from .csrf import CSRFProtectionMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Validate required environment variables
required_env_vars = ['DATABASE_URL', 'BETTER_AUTH_SECRET']
# AI API keys are optional for basic functionality
optional_env_vars = ['OPENROUTER_API_KEY', 'GEMINI_API_KEY']

missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    error_msg = f"Missing required environment variables: {', '.join(missing_vars)}"
    logger.error(error_msg)
    raise RuntimeError(error_msg)

# Warn about missing optional variables
missing_optional = [var for var in optional_env_vars if not os.getenv(var)]
if missing_optional:
    logger.warning(f"Missing optional environment variables: {', '.join(missing_optional)}. AI features may not work.")

logger.info("Environment variables validated successfully")

# Rate limiting configuration
class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
        self.max_requests = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
        self.window_seconds = int(os.getenv("RATE_LIMIT_WINDOW", "60"))

    def is_allowed(self, client_id: str) -> bool:
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.window_seconds)

        # Clean old requests
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > cutoff
        ]

        # Check if limit exceeded
        if len(self.requests[client_id]) >= self.max_requests:
            return False

        # Add current request
        self.requests[client_id].append(now)
        return True

rate_limiter = RateLimiter()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health check
        if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
            return await call_next(request)

        # Get client identifier (IP address)
        client_ip = request.client.host if request.client else "unknown"

        if not rate_limiter.is_allowed(client_ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )

        response = await call_next(request)

        # Add rate limit headers
        remaining = rate_limiter.max_requests - len(rate_limiter.requests[client_ip])
        reset_time = int((datetime.now() + timedelta(seconds=rate_limiter.window_seconds)).timestamp())

        response.headers["X-RateLimit-Limit"] = str(rate_limiter.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(reset_time)

        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    try:
        from .database import engine
        from sqlmodel import SQLModel

        if engine is None:
            logger.warning("Database engine is not initialized - skipping table creation")
        else:
            # Only create tables that don't exist
            SQLModel.metadata.create_all(engine)
            logger.info("Database tables created/verified successfully")
            logger.info("Note: Use 'alembic upgrade head' to run database migrations")
    except Exception as e:
        logger.error(f"Failed to create database tables: {str(e)}", exc_info=True)

    yield

    # Shutdown (if needed in future)
    logger.info("Application shutting down")

app = FastAPI(title="Todo Backend", version="1.0.0", lifespan=lifespan)

logger.info("Starting app initialization...")

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://localhost:3000",
    "https://localhost:3001",
]

# Add production frontend URL from environment variable
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    # Support comma-separated list of URLs
    frontend_urls = [url.strip() for url in frontend_url.split(',')]
    for url in frontend_urls:
        if url and url not in origins:
            origins.append(url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add CSRF protection middleware (must be after CORS)
csrf_secret = os.getenv("BETTER_AUTH_SECRET")
app.add_middleware(CSRFProtectionMiddleware, secret_key=csrf_secret)
logger.info("CSRF protection middleware enabled")

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Middleware to add request ID and log requests
@app.middleware("http")
async def add_request_id_and_log(request: Request, call_next):
    # Generate unique request ID
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id

    logger.info(f"Request: {request.method} {request.url} [ID: {request_id}]")
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        logger.info(f"Response: {response.status_code} [ID: {request_id}]")
        return response
    except Exception as e:
        logger.error(f"Middleware error: {str(e)} [ID: {request_id}]", exc_info=True)
        raise

# Import routers
try:
    logger.info("Importing auth router...")
    from .api import auth
    logger.info("Auth router imported successfully")

    # Register v1 API (current version)
    app.include_router(auth.router, prefix="/api/v1", tags=["auth", "v1"])
    logger.info("Auth router registered at /api/v1")

    # Register legacy API for backward compatibility (deprecated)
    app.include_router(auth.router, prefix="/api", tags=["auth", "legacy"])
    logger.info("Auth router registered at /api (legacy)")
except Exception as e:
    logger.error(f"Failed to import auth router: {str(e)}", exc_info=True)

try:
    logger.info("Importing tasks router...")
    from .api import tasks
    logger.info("Tasks router imported successfully")

    # Register v1 API (current version)
    app.include_router(tasks.router, prefix="/api/v1", tags=["tasks", "v1"])
    logger.info("Tasks router registered at /api/v1")

    # Register legacy API for backward compatibility (deprecated)
    app.include_router(tasks.router, prefix="/api", tags=["tasks", "legacy"])
    logger.info("Tasks router registered at /api (legacy)")
except Exception as e:
    logger.error(f"Failed to import tasks router: {str(e)}", exc_info=True)

# Phase III: AI Chatbot router
try:
    logger.info("Importing chat router...")
    from .api import chat
    logger.info("Chat router imported successfully")

    # Register v1 API (current version)
    app.include_router(chat.router, prefix="/api/v1", tags=["chat", "v1"])
    logger.info("Chat router registered at /api/v1")

    # Register legacy API for backward compatibility (deprecated)
    app.include_router(chat.router, prefix="/api", tags=["chat", "legacy"])
    logger.info("Chat router registered at /api (legacy)")
except Exception as e:
    logger.error(f"Failed to import chat router: {str(e)}", exc_info=True)

# Admin router for monitoring and management
try:
    logger.info("Importing admin router...")
    from .api import admin
    logger.info("Admin router imported successfully")

    # Register admin API (no legacy version needed)
    app.include_router(admin.router, tags=["admin"])
    logger.info("Admin router registered")
except Exception as e:
    logger.error(f"Failed to import admin router: {str(e)}", exc_info=True)



@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    from .error_responses import create_error_response, ErrorTypes

    # Map HTTP status codes to error types
    error_type_map = {
        400: ErrorTypes.BAD_REQUEST,
        401: ErrorTypes.AUTHENTICATION_ERROR,
        403: ErrorTypes.AUTHORIZATION_ERROR,
        404: ErrorTypes.NOT_FOUND_ERROR,
        409: ErrorTypes.CONFLICT_ERROR,
        429: ErrorTypes.RATE_LIMIT_ERROR,
    }

    error_type = error_type_map.get(exc.status_code, "HTTPError")
    request_id = request.state.request_id if hasattr(request.state, "request_id") else None

    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail} [ID: {request_id}]")

    error_response = create_error_response(
        error_type=error_type,
        message=exc.detail,
        status_code=exc.status_code,
        path=str(request.url.path),
        request_id=request_id
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    from .error_responses import create_error_response, ErrorTypes

    request_id = request.state.request_id if hasattr(request.state, "request_id") else None
    logger.error(f"Unhandled Exception: {str(exc)} [ID: {request_id}]", exc_info=True)

    # Sanitize error message for production
    is_debug = os.getenv("DEBUG", "false").lower() == "true"
    error_message = str(exc) if is_debug else "An internal server error occurred"

    error_response = create_error_response(
        error_type=ErrorTypes.INTERNAL_ERROR,
        message=error_message,
        status_code=500,
        path=str(request.url.path),
        request_id=request_id
    )

    return JSONResponse(
        status_code=500,
        content=error_response
    )

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handle CORS preflight requests"""
    # CORS headers are already handled by CORSMiddleware
    return JSONResponse(content={})

@app.get("/")
def read_root():
    return {"message": "Backend is running", "status": "ok"}

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    from .database import engine

    health_status = {
        "status": "healthy",
        "version": "1.0.0",
        "database": "disconnected"
    }

    # Check database connection
    try:
        if engine is not None:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                health_status["database"] = "connected"
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["database"] = f"error: {str(e)}"
        logger.error(f"Health check failed: {str(e)}")

    return health_status

@app.get("/api/health")
def api_health_check():
    """Comprehensive health check endpoint with database connectivity test"""
    health_status = {
        "status": "healthy",
        "service": "todo-backend",
        "version": "1.0.0",
        "checks": {}
    }

    # Check database connectivity
    try:
        from .database import engine
        if engine is None:
            health_status["checks"]["database"] = {
                "status": "unavailable",
                "message": "Database engine not initialized"
            }
            health_status["status"] = "degraded"
        else:
            from sqlalchemy import text
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            health_status["checks"]["database"] = {
                "status": "healthy",
                "message": "Database connection successful"
            }
    except Exception as e:
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }
        health_status["status"] = "unhealthy"

    # Check environment variables
    required_vars = ['DATABASE_URL', 'BETTER_AUTH_SECRET']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        health_status["checks"]["environment"] = {
            "status": "unhealthy",
            "message": f"Missing required variables: {', '.join(missing_vars)}"
        }
        health_status["status"] = "unhealthy"
    else:
        health_status["checks"]["environment"] = {
            "status": "healthy",
            "message": "All required environment variables present"
        }

    # Check optional services
    if not os.getenv('GEMINI_API_KEY'):
        health_status["checks"]["ai_service"] = {
            "status": "unavailable",
            "message": "GEMINI_API_KEY not configured - AI features disabled"
        }
    else:
        health_status["checks"]["ai_service"] = {
            "status": "healthy",
            "message": "AI service configured"
        }

    # Return appropriate status code
    status_code = 200 if health_status["status"] == "healthy" else 503
    return JSONResponse(content=health_status, status_code=status_code)