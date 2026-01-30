@echo off
cd /d "%~dp0"

REM Load environment variables from .env file
REM Make sure you have created a .env file with your credentials
REM See .env.example for required variables

if not exist .env (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and configure your credentials
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start the server (environment variables will be loaded from .env by the application)
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000