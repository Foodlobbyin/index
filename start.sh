#!/bin/bash

echo "======================================"
echo "   Starting Foodlobbyin Application"
echo "======================================"
echo ""

# Check if Docker is running
echo "[1/7] Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Please install Docker Desktop first."
    exit 1
fi
if ! docker info &> /dev/null; then
    echo "ERROR: Docker is not running. Please start Docker Desktop first."
    exit 1
fi
echo "✓ Docker is running"

# Check if Node.js is installed
echo ""
echo "[2/7] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install from https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js is installed ($(node --version))"

# Install dependencies if needed
echo ""
echo "[3/7] Installing dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Root npm install failed. Check your network connection and npm configuration."
        echo "Try running: npm install --verbose"
        exit 1
    fi
    echo "✓ Root dependencies installed"
else
    echo "✓ Root dependencies already installed"
fi

if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Backend npm install failed. Check your network connection and npm configuration."
        echo "Try running: cd backend && npm install --verbose"
        cd ..
        exit 1
    fi
    cd ..
    echo "✓ Backend dependencies installed"
else
    echo "✓ Backend dependencies already installed"
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Frontend npm install failed. Check your network connection and npm configuration."
        echo "Try running: cd frontend && npm install --verbose"
        cd ..
        exit 1
    fi
    cd ..
    echo "✓ Frontend dependencies installed"
else
    echo "✓ Frontend dependencies already installed"
fi

echo "✓ All dependencies verified and installed"

# Start Docker containers
echo ""
echo "[4/7] Starting Docker containers..."
cd infrastructure
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start Docker containers"
    cd ..
    exit 1
fi
cd ..
echo "✓ Docker containers started"

# Wait for database to be ready
echo ""
echo "[5/7] Waiting for database to be ready..."
sleep 5
echo "✓ Database should be ready"

# Initialize database (optional - will fail if already initialized, that's OK)
echo ""
echo "[6/7] Initializing database..."
docker exec -i foodlobbyin-db psql -U postgres -d foodlobbyin < infrastructure/db/init.sql 2>/dev/null || true
echo "✓ Database initialization attempted"

echo ""
echo "[7/7] Starting application..."
echo ""
echo "========================================"
echo "   Application Starting!"
echo "========================================"
echo ""

# Start backend in background
echo "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for servers to fully start
sleep 5

echo ""
echo "========================================"
echo "   ✓ Application Started!"
echo "========================================"
echo ""
echo "Access your application:"
echo "  • Homepage:  http://localhost:3000/"
echo "  • Login:     http://localhost:3000/login"
echo "  • API Docs:  http://localhost:5000/api-docs"
echo "  • pgAdmin:   http://localhost:5050"
echo ""
echo "PIDs:"
echo "  • Backend:  $BACKEND_PID"
echo "  • Frontend: $FRONTEND_PID"
echo ""
echo "Opening browser..."
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000/ &
elif command -v open &> /dev/null; then
    open http://localhost:3000/ &
fi

echo ""
echo "========================================"
echo "   Development Environment Running"
echo "========================================"
echo ""
echo "To stop the application:"
echo "  • Press Ctrl+C"
echo "  • Or run: ./stop.sh"
echo ""
echo "Logs are displayed below. Press Ctrl+C to stop."
echo "========================================"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping application...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; cd infrastructure && docker-compose down; echo 'Application stopped.'; exit 0" INT

# Keep script running
wait
