#!/bin/bash
# ============================================================================
# Kiosk Build Script
# Builds the application for production
# ============================================================================

set -e

echo ""
echo "========================================"
echo " Kiosk - Production Build"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing npm dependencies..."
    npm install
fi

echo "[INFO] Building frontend..."
npm run build

echo ""
echo "[INFO] Building Tauri application..."
npm run tauri build

echo ""
echo "========================================"
echo " Build Complete!"
echo "========================================"
echo ""
echo "Output files are in: src-tauri/target/release/bundle/"
echo ""
