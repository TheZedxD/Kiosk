@echo off
REM ============================================================================
REM Kiosk Build Script
REM Builds the application for production
REM ============================================================================

echo.
echo ========================================
echo  Kiosk - Production Build
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing npm dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install npm dependencies
        pause
        exit /b 1
    )
)

echo [INFO] Building frontend...
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed
    pause
    exit /b 1
)

echo.
echo [INFO] Building Tauri application...
call npm run tauri build
if errorlevel 1 (
    echo [ERROR] Tauri build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Build Complete!
echo ========================================
echo.
echo Output files are in: src-tauri\target\release\bundle\
echo.

pause
