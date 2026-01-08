import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the FastAPI app
from src.main import app

# This is what Vercel will call
__all__ = ['app']

