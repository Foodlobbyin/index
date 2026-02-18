#!/bin/bash

echo "======================================"
echo "   Stopping Foodlobbyin Application"
echo "======================================"
echo ""

# Stop any running npm dev servers
echo "Stopping Node.js servers..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true

# Stop Docker containers
echo "Stopping Docker containers..."
cd infrastructure
docker-compose down
cd ..

echo ""
echo "✓ Application stopped!"
echo ""
echo "To restart, run: ./start.sh"
echo ""
