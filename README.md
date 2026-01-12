# Kiosk

A Windows 2000 style kiosk application for Raspberry Pi, built with Tauri, 98.css, and WinBox.js.

## Overview

This application provides a nostalgic Windows 2000-style desktop environment designed to run as a kiosk on Raspberry Pi. It features:

- **Desktop Environment**: Classic Windows 2000 look and feel
- **Taskbar**: Top-positioned taskbar with Start button, program list, and system clock
- **Window Management**: Draggable, resizable windows using WinBox.js
- **98.css Styling**: Pixel-perfect Windows 2000 aesthetics
- **Tauri Backend**: Rust-powered system integration for low memory usage

## System Requirements

### For Development

- **Node.js** 18+ (LTS recommended)
- **Rust** 1.70+ (via rustup)
- **System Libraries** (Linux):
  - GTK 3
  - WebKitGTK 4.1
  - libsoup 3
  - Additional development packages

### For Production

- **Raspberry Pi 4/5** (4GB+ RAM recommended)
- **DietPi** or Raspberry Pi OS
- **Cage** Wayland compositor (for kiosk mode)

## Quick Start

### Windows

1. Install [Node.js](https://nodejs.org/) (LTS version)
2. Install [Rust](https://rustup.rs/)
3. Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with C++ workload
4. Run `install.bat` to install dependencies
5. Run `dev.bat` to start development

### Linux (Ubuntu/Debian)

```bash
# Install system dependencies
sudo apt update
sudo apt install -y \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  librsvg2-dev \
  libsoup-3.0-dev \
  libjavascriptcoregtk-4.1-dev

# Install Node.js (via nvm or nodesource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# Clone and setup
git clone <repository-url>
cd Kiosk
./install.sh

# Start development
./dev.sh
```

### Raspberry Pi (DietPi)

```bash
# Install dependencies
sudo apt update
sudo apt install -y \
  build-essential \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  librsvg2-dev \
  libsoup-3.0-dev \
  cage \
  seatd

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# Build and install
./install.sh
./release.sh
```

## Scripts

| Script | Description |
|--------|-------------|
| `install.bat` / `install.sh` | Install all dependencies |
| `dev.bat` / `dev.sh` | Start development server with hot reload |
| `build.bat` / `build.sh` | Build for production |
| `release.bat` / `release.sh` | Create release installers |

## Project Structure

```
Kiosk/
├── src/                      # Frontend source (TypeScript)
│   ├── components/           # UI components
│   │   ├── Desktop.ts        # Desktop manager
│   │   ├── Taskbar.ts        # Taskbar with clock
│   │   └── WindowManager.ts  # WinBox window management
│   ├── styles/               # CSS styles
│   │   └── main.css          # Windows 2000 styling
│   ├── types/                # TypeScript types
│   ├── utils/                # Utility functions
│   │   └── api.ts            # Tauri API wrapper
│   └── main.ts               # Application entry point
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── main.rs           # Rust entry point
│   │   └── lib.rs            # Backend commands
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
├── public/                   # Static assets
├── index.html                # Main HTML file
├── package.json              # Node dependencies
├── vite.config.js            # Vite bundler config
└── tsconfig.json             # TypeScript config
```

## Development Phases

### Phase 1 (Current) - Desktop Shell
- [x] Tauri project structure
- [x] Desktop environment with 98.css styling
- [x] Top taskbar with Start button and clock
- [x] WinBox window management
- [x] Basic Start menu
- [x] Desktop icons (My Computer, My Documents, Recycle Bin)
- [x] Rust backend with system info commands

### Phase 2 (Planned) - File Manager
- [ ] File browser with TreeJS
- [ ] Directory navigation
- [ ] File operations (copy, move, delete)
- [ ] Drive listing
- [ ] USB device detection

### Phase 3 (Planned) - Applications
- [ ] Terminal emulator (xterm.js)
- [ ] Notepad
- [ ] Calculator
- [ ] System monitor with uPlot charts

### Phase 4 (Planned) - Advanced Features
- [ ] Spreadsheet (FortuneSheet)
- [ ] Word processor (TipTap)
- [ ] Settings panel
- [ ] Theme customization
- [ ] Wallpaper support

## Kiosk Deployment

To run as a kiosk on Raspberry Pi:

1. Build the release version:
   ```bash
   ./release.sh
   ```

2. Install the .deb package:
   ```bash
   sudo dpkg -i src-tauri/target/release/bundle/deb/kiosk_*.deb
   ```

3. Configure DietPi for kiosk mode:
   ```bash
   # Set autostart mode
   sudo dietpi-autostart 17

   # Create startup script
   sudo tee /var/lib/dietpi/dietpi-autostart/custom.sh << 'EOF'
   #!/bin/bash
   exec cage -s -- /usr/bin/kiosk
   EOF
   sudo chmod +x /var/lib/dietpi/dietpi-autostart/custom.sh
   ```

4. Configure `/boot/config.txt` for graphics:
   ```ini
   dtoverlay=vc4-kms-v3d
   gpu_mem=256
   max_framebuffers=2
   ```

5. Reboot to start the kiosk.

## Performance Targets

| Metric | Target |
|--------|--------|
| Idle Memory | 30-40 MB (Tauri) + 20-30 MB (Cage) |
| Bundle Size | < 10 MB |
| Cold Startup | < 0.5 seconds |
| Animation | 60 FPS on Pi 4 |

## Contributing

Contributions are welcome! Please read the Design Document for architectural details.

## License

MIT
