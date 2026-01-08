from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/api/health")  
def health():
    return {"status": "healthy"}

@app.post("/api/signup")
def signup():
    return {"message": "signup endpoint"}

@app.post("/api/login")
def login():
    return {"message": "login endpoint"}





# Vercel expects app at module level
__all__ = ['app']
