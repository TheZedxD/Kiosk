#!/bin/bash
# ============================================================================
# Kiosk Dependency Installation
# Installs all required dependencies for development
# ============================================================================

set -e

echo ""
echo "========================================"
echo " Kiosk - Install Dependencies"
echo "========================================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js: https://nodejs.org/"
    echo ""
    echo "On Debian/Ubuntu/Raspberry Pi OS:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

echo "[INFO] Node.js version: $(node --version)"
echo "[INFO] npm version: $(npm --version)"

# Check for Rust
if ! command -v rustc &> /dev/null; then
    echo "[WARNING] Rust is not installed!"
    echo "Installing Rust via rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

echo "[INFO] Rust version: $(rustc --version)"
echo "[INFO] Cargo version: $(cargo --version)"

# Install system dependencies for Tauri on Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo ""
    echo "[INFO] Checking system dependencies for Tauri..."

    # Check for required packages
    MISSING_PKGS=""

    if ! dpkg -l | grep -q libwebkit2gtk-4.1; then
        MISSING_PKGS="$MISSING_PKGS libwebkit2gtk-4.1-dev"
    fi

    if ! dpkg -l | grep -q libgtk-3; then
        MISSING_PKGS="$MISSING_PKGS libgtk-3-dev"
    fi

    if ! dpkg -l | grep -q libayatana-appindicator3; then
        MISSING_PKGS="$MISSING_PKGS libayatana-appindicator3-dev"
    fi

    if [ -n "$MISSING_PKGS" ]; then
        echo "[INFO] Installing missing system packages..."
        sudo apt-get update
        sudo apt-get install -y $MISSING_PKGS librsvg2-dev
    fi
fi

echo ""
echo "[INFO] Installing npm dependencies..."
npm install

echo ""
echo "[INFO] Verifying Rust dependencies..."
cd src-tauri
cargo check
cd ..

echo ""
echo "========================================"
echo " Installation Complete!"
echo "========================================"
echo ""
echo "You can now run:"
echo "  ./dev.sh     - Start development server"
echo "  ./build.sh   - Build for production"
echo "  ./release.sh - Create release packages"
echo ""
