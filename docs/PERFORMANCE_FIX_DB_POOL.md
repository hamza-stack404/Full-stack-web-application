# PERFORMANCE FIX: Database Connection Pooling

## Issue
No explicit database connection pool configuration, leading to connection exhaustion under load.

## Current Code
```python
# backend/src/database.py
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
```

## Solution

### 1. Configure Connection Pool
```python
# backend/src/database.py

from sqlmodel import create_engine, Session
import os

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Production-ready connection pool configuration
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,  # Verify connections before using
        pool_size=20,        # Number of connections to maintain
        max_overflow=10,     # Additional connections when pool is full
        pool_recycle=3600,   # Recycle connections after 1 hour
        pool_timeout=30,     # Wait 30s for available connection
        connect_args={
            "connect_timeout": 10,  # PostgreSQL connection timeout
            "options": "-c statement_timeout=30000"  # 30s query timeout
        }
    )
else:
    engine = None
```

### 2. Add Connection Pool Monitoring
```python
# backend/src/main.py

@app.get("/api/health")
def api_health_check():
    health_status = {
        "status": "healthy",
        "service": "todo-backend",
        "version": "1.0.0",
        "checks": {}
    }

    # ... existing checks ...

    # Add connection pool stats
    try:
        from .database import engine
        if engine:
            pool = engine.pool
            health_status["checks"]["database_pool"] = {
                "status": "healthy",
                "size": pool.size(),
                "checked_in": pool.checkedin(),
                "checked_out": pool.checkedout(),
                "overflow": pool.overflow(),
                "total_connections": pool.size() + pool.overflow()
            }
    except Exception as e:
        health_status["checks"]["database_pool"] = {
            "status": "error",
            "message": str(e)
        }

    return health_status
```

### 3. Environment Configuration
```env
# backend/.env

# Database connection pool settings
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10
DB_POOL_RECYCLE=3600
DB_POOL_TIMEOUT=30
```

### 4. Dynamic Configuration
```python
# backend/src/database.py

pool_size = int(os.getenv("DB_POOL_SIZE", "20"))
max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "10"))
pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "3600"))
pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", "30"))

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=pool_size,
    max_overflow=max_overflow,
    pool_recycle=pool_recycle,
    pool_timeout=pool_timeout,
)
```

## Benefits
- ✅ Prevents connection exhaustion
- ✅ Better resource utilization
- ✅ Improved performance under load
- ✅ Automatic connection recycling
- ✅ Configurable per environment

## Recommended Settings

### Development
- pool_size: 5
- max_overflow: 5

### Production
- pool_size: 20
- max_overflow: 10

### High Traffic
- pool_size: 50
- max_overflow: 20

## Monitoring
Monitor these metrics:
- Connection pool utilization
- Connection wait times
- Connection errors
- Query execution times
