from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Todo Backend", version="1.0.0")

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://localhost:3000",
    "https://localhost:3001",
    "https://hamza-full-stack-web.vercel.app",
    "https://*.vercel.app",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get("/")
def read_root():
    return {"message": "Backend is running", "status": "ok"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "todo-backend"}

# Test signup endpoint
@app.post("/api/signup")
def test_signup(data: dict = None):
    return {"message": "Signup endpoint working", "data": data}

# Test login endpoint  
@app.post("/api/login")
def test_login(data: dict = None):
    return {"message": "Login endpoint working", "data": data}

logger.info("FastAPI app created successfully")




# Vercel expects app at module level
__all__ = ['app']
