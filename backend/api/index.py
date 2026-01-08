import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    from src.main import app
    print("Successfully imported app from src.main")
except Exception as e:
    print(f"Error importing app: {e}")
    import traceback
    traceback.print_exc()
    
    # Fallback minimal app
    from fastapi import FastAPI
    app = FastAPI()
    
    @app.get("/")
    def read_root():
        return {"error": f"Failed to import: {str(e)}"}
    
    @app.get("/health")
    def health():
        return {"status": "error", "message": str(e)}

# Vercel expects app at module level
__all__ = ['app']
