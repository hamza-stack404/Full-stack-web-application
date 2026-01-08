import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from src.main import app
except ImportError as e:
    # If import fails, create a minimal app
    from fastapi import FastAPI
    import traceback
    
    app = FastAPI()
    error_msg = traceback.format_exc()
    
    @app.get("/")
    def root():
        return {"error": "Import failed", "details": error_msg}
    
    @app.post("/api/signup")
    def signup():
        return {"error": "Import failed", "details": error_msg}

# This is the ASGI app that Vercel will call



# Vercel expects app at module level
__all__ = ['app']
