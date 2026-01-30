#!/usr/bin/env python
"""
Startup script for the backend server.
Loads environment variables from .env file and starts uvicorn.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file (override system env vars)
load_dotenv(override=True)

# Verify required environment variables are loaded
required_vars = ['DATABASE_URL', 'BETTER_AUTH_SECRET']
missing = [var for var in required_vars if not os.getenv(var)]
if missing:
    print(f"ERROR: Missing required environment variables: {', '.join(missing)}")
    print("Please check your .env file")
    exit(1)

print("[OK] Environment variables loaded successfully")
print(f"[OK] DATABASE_URL: {'*' * 20}...{os.getenv('DATABASE_URL')[-20:]}")
print(f"[OK] BETTER_AUTH_SECRET: {'*' * 30}")
if os.getenv('GEMINI_API_KEY'):
    print(f"[OK] GEMINI_API_KEY: {'*' * 30}")

# Start uvicorn server
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
        log_level="info"
    )
