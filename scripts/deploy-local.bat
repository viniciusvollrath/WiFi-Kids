@echo off
REM WiFi-Kids Local Deployment Script for Windows
REM This script builds and tests the application locally before deployment

setlocal EnableDelayedExpansion

echo 🚀 WiFi-Kids Local Deployment Script (Windows)
echo ==========================================

REM Check if we're in the right directory
if not exist "CLAUDE.md" (
    echo [ERROR] Please run this script from the WiFi-Kids root directory
    exit /b 1
)

REM Check for required commands
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is required but not installed. Please install Node.js 20+
    exit /b 1
)

where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is required but not installed. Please install Python 3.11+
    exit /b 1
)

echo [INFO] Setting up backend environment...
cd backend

REM Check if virtual environment exists
if not exist ".venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call .venv\Scripts\activate

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
python -m pip install --upgrade pip
pip install -e .

REM Run backend tests
echo [INFO] Running backend tests...
python run_tests.py --coverage
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend tests failed
    exit /b 1
)
echo [SUCCESS] Backend tests passed

REM Step 2: Frontend Setup
echo [INFO] Setting up frontend environment...
cd ..\ui\webapp\apps\pwa

REM Install frontend dependencies
echo [INFO] Installing frontend dependencies...
npm ci

REM Run frontend tests
echo [INFO] Running frontend tests...
npm run test:run
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend tests failed
    exit /b 1
)
echo [SUCCESS] Frontend tests passed

REM Build frontend
echo [INFO] Building frontend for production...
set VITE_API_URL=http://localhost:8002
set VITE_MOCK=false
set VITE_DEBUG=false

npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend build failed
    exit /b 1
)
echo [SUCCESS] Frontend build completed

REM Preview deployment
echo [SUCCESS] ✨ Local deployment ready!
echo [INFO] Frontend: http://localhost:8080 (preview)
echo [INFO] Backend:  http://localhost:8002 (if running)
echo.
echo [INFO] To start the backend server:
echo   cd backend ^&^& .venv\Scripts\activate ^&^& uvicorn api.main:app --host 0.0.0.0 --port 8002 --reload
echo.
echo [INFO] To start the preview server:
echo   npm run preview

REM Go back to root
cd ..\..\..\..\

echo [SUCCESS] 🎉 Local deployment completed successfully!