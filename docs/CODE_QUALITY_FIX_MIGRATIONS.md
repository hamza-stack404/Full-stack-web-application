# CODE QUALITY FIX: Remove Inline Migrations

## Issue
96 lines of migration logic in main.py violates separation of concerns and makes schema changes hard to track.

## Current Problem
```python
# backend/src/main.py:196-292
def migrate_task_table():
    """Add missing columns to task table if they don't exist"""
    # 96 lines of raw SQL migrations
```

## Solution: Use Alembic Exclusively

### Step 1: Create Proper Migration
```bash
cd backend

# Create migration for missing columns
alembic revision --autogenerate -m "add_task_columns_tags_recurring_timestamps"
```

### Step 2: Review Generated Migration
```python
# backend/alembic/versions/xxx_add_task_columns.py

def upgrade():
    # Add created_at if not exists
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='task' AND column_name='created_at'
            ) THEN
                ALTER TABLE task ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            END IF;
        END $$;
    """)

    # Add updated_at if not exists
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='task' AND column_name='updated_at'
            ) THEN
                ALTER TABLE task ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            END IF;
        END $$;
    """)

    # Add tags if not exists
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='task' AND column_name='tags'
            ) THEN
                ALTER TABLE task ADD COLUMN tags JSON;
            END IF;
        END $$;
    """)

    # Add is_recurring if not exists
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='task' AND column_name='is_recurring'
            ) THEN
                ALTER TABLE task ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
            END IF;
        END $$;
    """)

    # Add recurrence_pattern if not exists
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='task' AND column_name='recurrence_pattern'
            ) THEN
                ALTER TABLE task ADD COLUMN recurrence_pattern VARCHAR;
            END IF;
        END $$;
    """)

def downgrade():
    # Optionally remove columns (be careful in production)
    pass
```

### Step 3: Remove Migration from main.py
```python
# backend/src/main.py

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

            # REMOVE THIS LINE:
            # migrate_task_table()

            logger.info("Use 'alembic upgrade head' to run migrations")
    except Exception as e:
        logger.error(f"Failed to create database tables: {str(e)}", exc_info=True)

    yield

    # Shutdown (if needed in future)
    logger.info("Application shutting down")

# DELETE the entire migrate_task_table() function (lines 196-292)
```

### Step 4: Update Deployment Process
```bash
# Add to deployment script or CI/CD

# Run migrations before starting app
alembic upgrade head

# Then start the application
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### Step 5: Update Docker Compose
```yaml
# docker-compose.yml

services:
  backend:
    # ... existing config ...
    command: >
      sh -c "alembic upgrade head &&
             uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload"
```

### Step 6: Update README
```markdown
## Database Migrations

### Create a new migration
```bash
cd backend
alembic revision --autogenerate -m "description_of_changes"
```

### Apply migrations
```bash
cd backend
alembic upgrade head
```

### Rollback migration
```bash
cd backend
alembic downgrade -1
```

### View migration history
```bash
cd backend
alembic history
```
```

## Benefits
- ✅ Proper version control for schema changes
- ✅ Rollback capability
- ✅ Clear migration history
- ✅ Separation of concerns
- ✅ Safer deployments
- ✅ Team collaboration on schema changes

## Migration Best Practices
1. Always review auto-generated migrations
2. Test migrations on staging first
3. Create backup before running migrations
4. Use transactions for data migrations
5. Document breaking changes
6. Never edit applied migrations
