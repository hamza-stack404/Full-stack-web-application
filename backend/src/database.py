from sqlmodel import create_engine, Session
from fastapi import HTTPException, status
import os
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Production-ready connection pool configuration
    pool_size = int(os.getenv("DB_POOL_SIZE", "20"))
    max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "3600"))
    pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", "30"))

    logger.info(f"Connecting to database with pool_size={pool_size}, max_overflow={max_overflow}")
    try:
        engine = create_engine(
            DATABASE_URL,
            echo=False,
            pool_pre_ping=True,  # Verify connections before using
            pool_size=pool_size,  # Number of connections to maintain
            max_overflow=max_overflow,  # Additional connections when pool is full
            pool_recycle=pool_recycle,  # Recycle connections after 1 hour
            pool_timeout=pool_timeout,  # Wait 30s for available connection
            connect_args={
                "connect_timeout": 10,  # PostgreSQL connection timeout
            }
        )
        logger.info("Database engine created successfully")
    except Exception as e:
        logger.error(f"Failed to create database engine: {str(e)}")
        engine = None
else:
    logger.warning("DATABASE_URL not set in environment variables")
    engine = None


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
