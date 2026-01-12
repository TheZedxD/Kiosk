#!/bin/bash
# ============================================================================
# Kiosk Release Build Script
# Creates optimized release builds
# ============================================================================

set -e

echo ""
echo "========================================"
echo " Kiosk - Release Build"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing npm dependencies..."
    npm install
fi

echo "[INFO] Cleaning previous builds..."
rm -rf dist 2>/dev/null || true

echo ""
echo "[INFO] Building frontend for production..."
npm run build

echo ""
echo "[INFO] Building Tauri release..."
npm run tauri build

echo ""
echo "========================================"
echo " Release Build Complete!"
echo "========================================"
echo ""
echo "Installers created in:"
echo "  src-tauri/target/release/bundle/"
echo ""
echo "Available formats:"
echo "  - DEB package (Debian/Ubuntu/Raspberry Pi OS)"
echo "  - AppImage (portable Linux)"
echo ""
