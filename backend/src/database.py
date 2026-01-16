from sqlmodel import create_engine, Session
from fastapi import HTTPException, status
import os
from dotenv import load_dotenv
import logging
# from sqlalchemy import text # Removed import

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("DATABASE_URL not set in environment variables")
    # Don't raise - let the app start but fail gracefully on first DB call
    # This allows API endpoints to be visible even if DB is not configured
    DATABASE_URL = "postgresql://user:password@localhost/tododb"  # Dummy URL
    engine = None
else:
    logger.info(f"Connecting to database: {DATABASE_URL[:50]}...")
    try:
        engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
        logger.info("Database engine created successfully")
    except Exception as e:
        logger.error(f"Failed to create database engine: {str(e)}")
        engine = None
        # Don't raise - let app continue


def get_db():
    """
    Centralized database session dependency.
    Yields a database session and ensures proper cleanup.
    """
    if engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not configured."
        )
    with Session(engine) as session:
        yield session
