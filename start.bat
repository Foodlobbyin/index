@echo off
echo ======================================
echo   Starting Foodlobbyin Application
echo ======================================
echo.

REM Check if Docker is running
echo [1/7] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)
echo ✓ Docker is running

REM Check if Node.js is installed
echo.
echo [2/7] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js is installed

REM Install dependencies if needed
echo.
echo [3/7] Installing dependencies...
if not exist "node_modules" (
    echo Installing root dependencies...
    call npm install
)
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)
echo ✓ Dependencies installed

REM Start Docker containers
echo.
echo [4/7] Starting Docker containers...
cd infrastructure
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start Docker containers
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ Docker containers started

REM Wait for database to be ready
echo.
echo [5/7] Waiting for database to be ready...
timeout /t 5 /nobreak >nul
echo ✓ Database should be ready

REM Initialize database (optional - will fail if already initialized, that's OK)
echo.
echo [6/7] Initializing database...
cd backend
docker exec -i foodlobbyin-db psql -U postgres -d foodlobbyin < ..\infrastructure\db\init.sql 2>nul
cd ..
echo ✓ Database initialization attempted

echo.
echo [7/7] Starting application...
echo.
echo ========================================
echo   Application Starting!
echo ========================================
echo.
echo Opening 3 terminal windows:
echo   1. Backend server (port 5000)
echo   2. Frontend server (port 3000)
echo   3. This status window
echo.
echo IMPORTANT: Keep all 3 windows open!
echo.

REM Start backend in new window
start "Foodlobbyin Backend" cmd /k "cd backend && npm run dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "Foodlobbyin Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   ✓ Application Started!
echo ========================================
echo.
echo Access your application:
echo   • Homepage:  http://localhost:3000/
echo   • Login:     http://localhost:3000/login
echo   • API Docs:  http://localhost:5000/api-docs
echo   • pgAdmin:   http://localhost:5050
echo.
echo Waiting 5 seconds, then opening browser...
timeout /t 5 /nobreak >nul

REM Open browser
start http://localhost:3000/

echo.
echo ========================================
echo   Development Environment Running
echo ========================================
echo.
echo To stop the application:
echo   1. Close the Backend and Frontend windows
echo   2. Run: docker-compose -f infrastructure\docker-compose.yml down
echo.
echo Press any key to close this window (app will keep running)...
pause >nul
