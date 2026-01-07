@echo off
REM Quick Start Script for Todo App

echo ========================================
echo Todo App - Full Stack Quick Start
echo ========================================
echo.

REM Check if running from project root
if not exist "backend" (
    echo ERROR: Please run this script from the project root directory
    echo Current directory: %cd%
    pause
    exit /b 1
)

echo Starting backend and frontend...
echo.

REM Start Backend in new terminal
echo [1/2] Starting Backend (localhost:8000)...
start "Backend - Todo App" cmd /k "cd backend && call run_backend.bat"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start Frontend in new terminal
echo [2/2] Starting Frontend (localhost:3000)...
start "Frontend - Todo App" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Services Started!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo.
echo Two new windows should have opened.
echo If not, manually run:
echo   - backend\run_backend.bat
echo   - cd frontend && npm run dev
echo.
pause
