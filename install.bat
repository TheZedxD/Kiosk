@echo off
REM ============================================================================
REM Kiosk Dependency Installation
REM Installs all required dependencies for development
REM ============================================================================

echo.
echo ========================================
echo  Kiosk - Install Dependencies
echo ========================================
echo.

REM Check for Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js version:
call node --version

REM Check for npm
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

echo [INFO] npm version:
call npm --version

REM Check for Rust
where rustc >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Rust is not installed!
    echo Please install Rust from https://rustup.rs/
    echo.
    echo After installing Rust, run this script again.
    pause
    exit /b 1
)

echo [INFO] Rust version:
call rustc --version

echo [INFO] Cargo version:
call cargo --version

echo.
echo [INFO] Installing npm dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install npm dependencies
    pause
    exit /b 1
)

echo.
echo [INFO] Installing Tauri CLI...
call npm install -D @tauri-apps/cli
if errorlevel 1 (
    echo [ERROR] Failed to install Tauri CLI
    pause
    exit /b 1
)

echo.
echo [INFO] Verifying Rust dependencies...
cd src-tauri
call cargo check
if errorlevel 1 (
    echo [ERROR] Rust dependency check failed
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo You can now run:
echo   dev.bat     - Start development server
echo   build.bat   - Build for production
echo   release.bat - Create release installers
echo.

pause
