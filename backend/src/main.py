from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Todo Backend", version="1.0.0")

logger.info("Starting app initialization...")

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://localhost:3000",
    "https://localhost:3001",
    "https://hamza-full-stack-web.vercel.app",
]

# Add production frontend URL from environment variable if available
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"Response: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Middleware error: {str(e)}", exc_info=True)
        raise

# Import routers
try:
    logger.info("Importing auth router...")
    from .api import auth
    logger.info("Auth router imported successfully")
    app.include_router(auth.router, prefix="/api", tags=["auth"])
    logger.info("Auth router registered at /api")
except Exception as e:
    logger.error(f"Failed to import auth router: {str(e)}", exc_info=True)

try:
    logger.info("Importing tasks router...")
    from .api import tasks
    logger.info("Tasks router imported successfully")
    app.include_router(tasks.router, prefix="/api", tags=["tasks"])
    logger.info("Tasks router registered at /api")
except Exception as e:
    logger.error(f"Failed to import tasks router: {str(e)}", exc_info=True)


try:
    from .database import engine
except Exception as e:
    logger.error(f"Failed to import database engine: {str(e)}", exc_info=True)
    engine = None

try:
    from sqlmodel import SQLModel
except Exception as e:
    logger.error(f"Failed to import SQLModel: {str(e)}", exc_info=True)

@app.on_event("startup")
def on_startup():
    """Initialize database tables on startup"""
    try:
        if engine is None:
            logger.warning("Database engine is not initialized - skipping table creation")
            return

        # Only create tables that don't exist
        # Don't drop existing tables - too destructive
        SQLModel.metadata.create_all(engine)
        logger.info("Database tables created/verified successfully")

        # Run schema migrations for existing tables
        migrate_task_table()

    except Exception as e:
        logger.error(f"Failed to create database tables: {str(e)}", exc_info=True)
        # Continue anyway - might already exist or DB connection issue

def migrate_task_table():
    """Add missing columns to task table if they don't exist"""
    try:
        if engine is None:
            return

        from sqlalchemy import text, inspect

        with engine.connect() as conn:
            inspector = inspect(engine)

            # Check if task table exists
            if 'task' not in inspector.get_table_names():
                logger.info("Task table doesn't exist yet, skipping migration")
                return

            # Get existing columns
            existing_columns = {col['name'] for col in inspector.get_columns('task')}
            logger.info(f"Existing task table columns: {existing_columns}")

            # Add priority column if it doesn't exist
            if 'priority' not in existing_columns:
                logger.info("Adding 'priority' column to task table")
                conn.execute(text("ALTER TABLE task ADD COLUMN priority VARCHAR DEFAULT 'medium'"))
                conn.commit()
                logger.info("Added 'priority' column successfully")

            # Add category column if it doesn't exist
            if 'category' not in existing_columns:
                logger.info("Adding 'category' column to task table")
                conn.execute(text("ALTER TABLE task ADD COLUMN category VARCHAR"))
                conn.commit()
                logger.info("Added 'category' column successfully")

            # Add due_date column if it doesn't exist
            if 'due_date' not in existing_columns:
                logger.info("Adding 'due_date' column to task table")
                conn.execute(text("ALTER TABLE task ADD COLUMN due_date TIMESTAMP WITH TIME ZONE"))
                conn.commit()
                logger.info("Added 'due_date' column successfully")

            # Add subtasks column if it doesn't exist
            if 'subtasks' not in existing_columns:
                logger.info("Adding 'subtasks' column to task table")
                conn.execute(text("ALTER TABLE task ADD COLUMN subtasks JSON"))
                conn.commit()
                logger.info("Added 'subtasks' column successfully")

            # Add created_at column if it doesn't exist
            if 'created_at' not in existing_columns:
                logger.info("Adding 'created_at' column to task table")
                conn.execute(text("ALTER TABLE task ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"))
                conn.commit()
                logger.info("Added 'created_at' column successfully")

            # Add updated_at column if it doesn't exist
            if 'updated_at' not in existing_columns:
                logger.info("Adding 'updated_at' column to task table")
                conn.execute(text("ALTER TABLE task ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"))
                conn.commit()
                logger.info("Added 'updated_at' column successfully")

            logger.info("Task table migration completed successfully")

    except Exception as e:
        logger.error(f"Failed to migrate task table: {str(e)}", exc_info=True)
        # Continue anyway - app should still work

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": "https://hamza-full-stack-web.vercel.app",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": "https://hamza-full-stack-web.vercel.app",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        }
    )

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handle CORS preflight requests"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "https://hamza-full-stack-web.vercel.app",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        }
    )

@app.get("/")
def read_root():
    return {"message": "Backend is running", "status": "ok"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "todo-backend"}