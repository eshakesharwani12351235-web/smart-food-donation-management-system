@echo off
title Smart Food Donation System - Launcher
color 0A

echo ===================================================================
echo     SMART FOOD DONATION & MANAGEMENT SYSTEM - MCA PROJECT
echo ===================================================================
echo.
echo [1/3] Checking MongoDB...

:: Check if port 27017 is already listening
netstat -ano | findstr 27017 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] MongoDB is already running on port 27017.
) else (
    echo [INFO] Starting MongoDB from local installation...
    if not exist "%~dp0data\db" mkdir "%~dp0data\db"
    start "MongoDB Server" /min "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "%~dp0data\db" --port 27017
    timeout /t 3 /nobreak >nul
)

echo.
echo [2/3] Launching Web Browser at http://localhost:5000 ...
timeout /t 2 /nobreak >nul
start http://localhost:5000

echo.
echo [3/3] Starting Node.js / Express Backend Server...
echo Press Ctrl+C in this window anytime to stop the server.
echo ===================================================================
echo.

node backend/server.js
pause
