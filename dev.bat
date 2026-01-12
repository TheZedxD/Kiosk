@echo off
REM ============================================================================
REM Kiosk Development Server
REM Starts both Vite dev server and Tauri in development mode
REM ============================================================================

echo.
echo ========================================
echo  Kiosk - Development Mode
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

REM Check if Cargo.toml exists
if not exist "src-tauri\Cargo.toml" (
    echo [ERROR] src-tauri\Cargo.toml not found
    pause
    exit /b 1
)

echo [INFO] Starting Tauri development server...
echo [INFO] This will open the application window when ready.
echo [INFO] Press Ctrl+C to stop.
echo.

call npm run tauri:dev

pause
