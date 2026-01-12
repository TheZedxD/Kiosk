#!/bin/bash
# ============================================================================
# Kiosk Development Server
# Starts both Vite dev server and Tauri in development mode
# ============================================================================

set -e

echo ""
echo "========================================"
echo " Kiosk - Development Mode"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing npm dependencies..."
    npm install
fi

# Check if src-tauri exists
if [ ! -f "src-tauri/Cargo.toml" ]; then
    echo "[ERROR] src-tauri/Cargo.toml not found"
    exit 1
fi

echo "[INFO] Starting Tauri development server..."
echo "[INFO] This will open the application window when ready."
echo "[INFO] Press Ctrl+C to stop."
echo ""

npm run tauri:dev
