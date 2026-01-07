from sqlmodel import create_engine
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
    raise ValueError("DATABASE_URL environment variable is not set")

logger.info(f"Connecting to database: {DATABASE_URL[:50]}...")

try:
    engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {str(e)}")
    raise

# Removed drop_alembic_version_table_if_exists function
