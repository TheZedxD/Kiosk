@echo off
REM ============================================================================
REM Kiosk Release Build Script
REM Creates optimized release builds with all installers
REM ============================================================================

echo.
echo ========================================
echo  Kiosk - Release Build
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

echo [INFO] Cleaning previous builds...
if exist "dist" rmdir /s /q dist
if exist "src-tauri\target\release" rmdir /s /q src-tauri\target\release 2>nul

echo.
echo [INFO] Building frontend for production...
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed
    pause
    exit /b 1
)

echo.
echo [INFO] Building Tauri release...
call npm run tauri build -- --release
if errorlevel 1 (
    echo [ERROR] Tauri release build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Release Build Complete!
echo ========================================
echo.
echo Installers created in:
echo   src-tauri\target\release\bundle\
echo.
echo Available formats:
echo   - MSI installer (Windows)
echo   - NSIS installer (Windows)
echo   - DEB package (Linux - if cross-compiled)
echo.

pause
