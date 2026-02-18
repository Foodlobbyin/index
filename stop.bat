@echo off
echo ======================================
echo   Stopping Foodlobbyin Application
echo ======================================
echo.

echo Stopping Docker containers...
cd infrastructure
docker-compose down
cd ..

echo.
echo ✓ Application stopped!
echo.
echo To restart, run: start.bat
echo.
pause
