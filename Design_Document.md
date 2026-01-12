# Windows 2000 Kiosk System on Raspberry Pi: Technical Design Document

**Tauri and DietPi deliver an authentic retro desktop experience with surprisingly low resource overhead.** This design document outlines a complete architecture for building a Windows 2000-themed kiosk system that runs natively on Raspberry Pi 4/5 with Pi Zero 2W as a stretch goal. The system combines modern web technologies with Rust-powered system integration, achieving **30-40MB idle memory usage** compared to Electron's 200-300MB—critical for embedded deployment.

The key insight driving this architecture: WebKitGTK's system webview eliminates bundled browser overhead while 98.css and WinBox.js provide pixel-perfect Windows 2000 aesthetics with minimal JavaScript. Combined with Cage's Wayland kiosk compositor at just **20-30MB overhead**, the entire stack targets under 200MB total RAM usage at idle.

---

## Tauri delivers 5-10x memory efficiency over Electron on ARM

Tauri's architecture fundamentally differs from Electron by leveraging the system's native WebView (WebKitGTK on Linux) rather than bundling Chromium. On Raspberry Pi, this translates to dramatic resource savings:

| Metric | Tauri | Electron |
|--------|-------|----------|
| **Idle memory** | 30-40 MB | 200-300 MB |
| **Under load** | 50-100 MB | 300-500 MB |
| **Bundle size** | 2.5-10 MB | 85-150 MB |
| **Cold startup** | <0.5 seconds | 1-2 seconds |

The Rust backend compiles to native ARM64 binary with zero runtime overhead, while Electron's Node.js event loop consumes CPU cycles even when idle. For heavy computational tasks—reading system sensors, file operations, process management—Tauri's Rust backend significantly outperforms JavaScript alternatives.

**WebKitGTK limitations on Pi require acknowledgment.** Hardware acceleration is problematic; CSS transitions may appear as visible steps rather than smooth animations. The environment variable `WEBKIT_FORCE_COMPOSITING_MODE=1` can cause display artifacts. The recommendation: minimize animations, use transform-based effects only where essential, and test extensively on actual hardware. Screen tearing has been reported on Tauri apps running on Raspberry Pi (GitHub issue #9289), mitigated by proper KMS driver configuration.

For the Tauri configuration, enable kiosk-appropriate settings:

```json
{
  "tauri": {
    "windows": [{
      "fullscreen": true,
      "decorations": false,
      "resizable": false,
      "alwaysOnTop": true
    }],
    "bundle": { "targets": ["deb"] }
  }
}
```

The `deb` target is mandatory—AppImages cannot be cross-compiled for ARM64.

---

## 98.css and WinBox.js form the UI foundation

The Windows 2000 aesthetic closely mirrors Windows 98's "Classic" theme, making **98.css** the ideal CSS foundation. This pure-CSS library delivers pixel-perfect recreation of beveled buttons, title bar gradients, and 3D borders without JavaScript dependencies—approximately **20KB** bundled.

```html
<link rel="stylesheet" href="https://unpkg.com/98.css">
```

For window management, **WinBox.js** provides the most complete solution at just **12KB gzipped**:

- Zero dependencies, excellent performance
- Automatic z-index management via `WinBox.stack()`
- Built-in minimize, maximize, fullscreen, modal support
- Viewport constraints prevent windows from leaving screen bounds
- Callbacks for all window lifecycle events

The integration pattern combines 98.css styling with WinBox functionality:

```javascript
new WinBox({
  title: "My Computer",
  class: ["window"], // Apply 98.css window class
  width: 400,
  height: 300,
  mount: document.getElementById("file-manager-content"),
  onclose: function(force) {
    return !force && !confirm("Close window?");
  }
});
```

For complete desktop functionality including menu bars, **OS-GUI.js** provides the missing pieces: menu bars with keyboard shortcuts, nested submenus, and even runtime loading of actual Windows `.theme` files. It powers 98.js.org—the most complete Windows 98 web recreation available—and supports flying titlebar animations authentic to the original OS.

**Font selection matters for authenticity.** Windows 2000 defaulted to Tahoma (not MS Sans Serif like Windows 98). The recommended CSS stack:

```css
body {
  font-family: "Tahoma", "Segoe UI", "Verdana", sans-serif;
  font-size: 11px;
}
```

Web font files for MS Sans Serif are available from the React95 project if exact Windows 98 styling is preferred.

---

## Cage delivers the lightest kiosk compositor

For display server selection, **Cage** (a Wayland kiosk compositor) represents the optimal choice for Pi 4/5 deployments. Purpose-built for single-application kiosk use, it consumes only **20-30MB RAM** versus 40-60MB for Weston or 30-50MB for X11+Openbox.

The systemd service configuration for Cage:

```ini
[Unit]
Description=Tauri Kiosk Application
After=seatd.service
Requires=seatd.service

[Service]
Type=simple
User=dietpi
Environment="XDG_RUNTIME_DIR=/run/user/1000"
Environment="WLR_LIBINPUT_NO_DEVICES=1"
ExecStartPre=/bin/sleep 2
ExecStart=/usr/bin/cage -s -- /opt/kiosk/app-binary
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**DietPi configuration requires specific setup.** Set autostart mode 17 (custom script) via `dietpi-autostart 17`, then place the startup script at `/var/lib/dietpi/dietpi-autostart/custom.sh`. For pre-first-boot automation, edit `/boot/dietpi.txt`:

```ini
AUTO_SETUP_AUTOMATED=1
AUTO_SETUP_AUTOSTART_TARGET_INDEX=17
AUTO_SETUP_AUTOSTART_LOGIN_USER=dietpi
```

Graphics acceleration requires the KMS driver in `/boot/config.txt`:

```ini
dtoverlay=vc4-kms-v3d
gpu_mem=256
max_framebuffers=2
hdmi_force_hotplug=1
```

Pi 4 uses VideoCore VI (V3D 4.2) with full OpenGL ES 3.1 and Vulkan 1.2 support. Pi 5 upgrades to VideoCore VII (V3D 7.1) with improved performance. Both support WebGL 2.0, making Three.js viable for 3D effects—though complex scenes should target 30fps with optimized geometry.

---

## Application components use proven web libraries

### File manager architecture

Tauri's official filesystem plugin (`@tauri-apps/plugin-fs`) provides secure directory listing, file operations, and path validation. The frontend uses **TreeJS** for Windows-like folder navigation—vanilla JavaScript with zero dependencies, matching the native file browser behavior users expect.

```javascript
import { readDir, BaseDirectory } from '@tauri-apps/plugin-fs';
const entries = await readDir('documents', { baseDir: BaseDirectory.Home });
```

File icons map by extension using SVG assets extracted from Windows 2000 or recreated for scalability. Drag-and-drop uses HTML5 Drag API for UI interactions, with actual file operations (`copyFile`, `rename`) handled through Tauri commands.

### Terminal emulator implementation

**xterm.js** remains the de facto standard, powering VS Code's integrated terminal and Azure Cloud Shell. At ~200KB with tree-shaking support, it provides complete ANSI escape code handling, Unicode support, and extensive theming.

The critical integration piece is PTY (pseudo-terminal) support. The **tauri-plugin-pty** crate connects xterm.js to actual Linux shells:

```toml
# Cargo.toml
tauri-plugin-pty = "0.1.1"
```

```javascript
import { spawn } from 'tauri-pty';
const pty = spawn('/bin/bash', [], { cols: 80, rows: 24 });
pty.onData(data => term.write(data));
term.onData(data => pty.write(data));
```

Theme the terminal to match Command Prompt aesthetics:

```javascript
const term = new Terminal({
  theme: { background: '#000000', foreground: '#C0C0C0', cursor: '#C0C0C0' },
  fontFamily: 'Lucida Console, monospace',
  fontSize: 14
});
```

### Spreadsheet and word processing

**FortuneSheet** (TypeScript rewrite of Luckysheet) provides full spreadsheet functionality without jQuery dependency—the original Luckysheet reached end-of-life in January 2024. For file format compatibility, **SheetJS** handles .xls/.xlsx import/export at ~50KB for the mini bundle.

For word processing, **TipTap** offers the best balance between features and bundle size (~70KB). Built on ProseMirror, it provides rich text editing with modular architecture. Document import uses **mammoth.js** for .docx conversion, though only read support exists—no .doc format and no write capability.

For simple Notepad functionality, a plain `<textarea>` styled with 98.css suffices and adds zero bundle weight.

### System monitor with live Pi stats

The **sysinfo** Rust crate provides comprehensive cross-platform system information:

```rust
use sysinfo::{System, SystemExt, CpuExt, ComponentExt};

#[tauri::command]
fn get_system_stats() -> SystemStats {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    SystemStats {
        cpu_usage: sys.global_cpu_info().cpu_usage(),
        total_memory: sys.total_memory(),
        used_memory: sys.used_memory(),
        temperatures: sys.components()
            .iter()
            .map(|c| (c.label().to_string(), c.temperature()))
            .collect(),
    }
}
```

For Pi-specific metrics (GPU temperature, throttling status), shell out to `vcgencmd`:

```rust
let output = Command::new("vcgencmd").arg("measure_temp").output()?;
```

**uPlot** charts the data at just **48KB**—handling 100K+ data points at 60fps through WebGL acceleration. This dramatically outperforms Chart.js (~254KB) for real-time monitoring scenarios.

### USB device detection

The `sysinfo` crate exposes disk information including removable status. For real-time mount/unmount events, Linux udev integration provides reliable notifications:

```rust
#[tauri::command]
fn list_drives() -> Vec<DriveInfo> {
    let mut sys = System::new_all();
    sys.refresh_disks_list();
    
    sys.disks()
        .iter()
        .filter(|d| d.is_removable())
        .map(|d| DriveInfo {
            name: d.name().to_string_lossy().to_string(),
            mount_point: d.mount_point().to_string_lossy().to_string(),
            available_space: d.available_space(),
        })
        .collect()
}
```

Safe eject calls `umount` through Tauri's shell plugin with appropriate permissions.

---

## Performance optimization targets 60fps on Pi 4

### GPU-accelerated CSS properties only

Animate only `transform` and `opacity`—these offload to GPU compositing:

```css
.animated-element {
  transform: translateX(100px);
  opacity: 0.8;
  transition: transform 0.3s ease, opacity 0.3s ease;
}
```

**Avoid animating** `width`, `height`, `padding`, `margin`, `box-shadow`, or `border-radius`. These trigger expensive layout recalculation or paint operations that devastate performance on Pi's limited GPU.

Use `will-change` sparingly and remove after animation completes:

```javascript
element.style.willChange = 'transform';
// perform animation
element.style.willChange = 'auto'; // MUST remove after
```

CSS containment isolates rendering work:

```css
.independent-window {
  contain: content; /* layout + paint + style containment */
}

.offscreen-content {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}
```

### Memory management for long-running kiosk

SPAs running 24/7 accumulate memory leaks from event listeners, timers, and closures. Defensive patterns:

```javascript
// Always remove event listeners
class WindowComponent {
  connectedCallback() {
    this.handleResize = () => this.onResize();
    window.addEventListener('resize', this.handleResize);
  }
  
  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
  }
}

// Use WeakMap for DOM element metadata
const elementMetadata = new WeakMap();
// Entries automatically garbage collected when elements removed
```

For window-heavy UIs, implement object pooling for frequently created/destroyed elements. Null references explicitly when closing windows to aid garbage collection.

### Code splitting with Vite

Lazy-load window components on demand:

```typescript
const windowComponents = {
  calculator: () => import('./windows/Calculator'),
  settings: () => import('./windows/Settings'),
  fileManager: () => import('./windows/FileManager'),
};

async function openWindow(type: string) {
  const module = await windowComponents[type]();
  return module.default;
}
```

Preload likely-needed windows on hover or after initial load completes:

```typescript
// Preload on hover
<button onMouseEnter={() => windowComponents.settings()}>
  Settings
</button>
```

---

## Hardware detection enables adaptive resolution

Read Pi model and RAM to adapt UI complexity:

```rust
#[tauri::command]
fn get_system_info() -> Result<SystemInfo, String> {
    let model = fs::read_to_string("/sys/firmware/devicetree/base/model")
        .unwrap_or_else(|_| "Unknown".to_string())
        .trim_matches('\0').to_string();
    
    let meminfo = fs::read_to_string("/proc/meminfo").unwrap_or_default();
    let mem_total_kb: u64 = meminfo.lines()
        .find(|l| l.starts_with("MemTotal"))
        .and_then(|l| l.split_whitespace().nth(1))
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);
    
    Ok(SystemInfo { model, ram_mb: mem_total_kb / 1024 })
}
```

Frontend resolution selection:

```typescript
function getOptimalResolution(profile: HardwareProfile): '720p' | '1080p' {
  // Pi 5 or Pi 4 with 4GB+ RAM can handle 1080p
  if (profile.isPi5 || (profile.isPi4 && profile.ramMB >= 4000)) {
    return '1080p';
  }
  return '720p';
}
```

**Pi Zero 2W presents significant challenges.** With only 512MB RAM and VideoCore IV (OpenGL ES 2.0 only), it represents a stretch goal requiring:

- 32-bit OS (saves ~50MB RAM)
- Swap enabled (1GB recommended)
- `gpu_mem=16` to maximize available RAM
- X11+Openbox instead of Cage (lighter)
- Minimal animations, 720p maximum
- Consider alternative lightweight browsers if Tauri proves too heavy

---

## Touch input requires explicit handling

The Pointer Events API unifies mouse and touch handling:

```javascript
element.addEventListener('pointerdown', (e) => {
  console.log(`Type: ${e.pointerType}`); // 'mouse', 'touch', 'pen'
  element.setPointerCapture(e.pointerId);
});
```

**Prevent browser zoom behaviors** that break kiosk experience:

```css
html, body {
  touch-action: none; /* Disable all browser gestures */
  -webkit-user-select: none;
  user-select: none;
}
```

Implement long-press for right-click functionality:

```javascript
class LongPressHandler {
  private timer: number | null = null;
  
  constructor(element: HTMLElement, callback: (e: PointerEvent) => void) {
    element.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') {
        this.timer = window.setTimeout(() => callback(e), 500);
      }
    });
    
    ['pointerup', 'pointermove', 'pointercancel'].forEach(event =>
      element.addEventListener(event, () => this.cancel())
    );
  }
  
  private cancel() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}
```

Touch targets require minimum **44x44 pixels** (Apple guideline) with 8px spacing between targets to prevent accidental activation.

---

## Build and deployment automation

### Cross-compilation from x86 to ARM64

Docker provides reproducible cross-compilation:

```dockerfile
FROM ubuntu:jammy
RUN dpkg --add-architecture arm64
RUN apt-get update && apt-get install -y \
    gcc-aarch64-linux-gnu \
    libwebkit2gtk-4.1-dev:arm64 \
    libgtk-3-dev:arm64 \
    libssl-dev:arm64

ENV PKG_CONFIG_SYSROOT_DIR=/usr/aarch64-linux-gnu/
```

Cargo configuration for ARM64:

```toml
# .cargo/config.toml
[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"
```

Build command:

```bash
cargo tauri build --target aarch64-unknown-linux-gnu --bundles deb
```

**Native compilation on Pi 4 takes 30-60 minutes** but avoids cross-compilation complexity. GitHub Actions now offers ARM64 runners for CI/CD integration.

### DietPi installation script

```bash
#!/bin/bash
set -e

# Install runtime dependencies
apt install -y --no-install-recommends \
  cage seatd libinput10 \
  libwebkit2gtk-4.1-0 libgtk-3-0 \
  gstreamer1.0-plugins-base gstreamer1.0-gl

# Enable seatd for Cage
systemctl enable seatd
usermod -aG video,input dietpi

# Deploy application
mkdir -p /opt/kiosk
cp ./kiosk-app /opt/kiosk/

# Install systemd service
cp kiosk.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable kiosk.service
```

Git-based updates poll for VERSION file changes:

```bash
#!/bin/bash
cd /opt/kiosk-repo
CURRENT=$(cat VERSION)
git fetch origin main
REMOTE=$(git show origin/main:VERSION)

if [ "$CURRENT" != "$REMOTE" ]; then
    systemctl stop kiosk.service
    git pull origin main
    cp releases/kiosk-app /opt/kiosk/
    systemctl start kiosk.service
fi
```

---

## Estimated resource budget

| Component | Bundle Size | Runtime RAM |
|-----------|-------------|-------------|
| Tauri runtime | - | 30-40 MB |
| Cage compositor | - | 20-30 MB |
| 98.css | 20 KB | - |
| WinBox.js | 12 KB | - |
| xterm.js | 200 KB | - |
| FortuneSheet | 300 KB | - |
| TipTap | 70 KB | - |
| uPlot | 48 KB | - |
| SheetJS mini | 50 KB | - |
| **Total** | **~700 KB** | **~100 MB idle** |

This leaves comfortable headroom on Pi 4's 4-8GB RAM. Pi Zero 2W's 512MB remains challenging but potentially achievable with aggressive optimization and the 32-bit OS path.

## Conclusion

This architecture delivers an authentic Windows 2000 experience through carefully selected web technologies optimized for Raspberry Pi's constraints. The combination of Tauri's memory efficiency, 98.css's pixel-perfect styling, and Cage's minimal compositor overhead creates a viable embedded kiosk platform.

**Critical success factors** include testing on actual Pi hardware early (emulation hides GPU issues), minimizing CSS animations due to WebKitGTK's limited acceleration, and implementing defensive memory management for 24/7 operation. The Pi Zero 2W stretch goal requires separate validation—512MB may prove insufficient for the full application suite, potentially requiring a reduced-feature mode or alternative approach for that hardware target.

The recommended development path: build the core desktop shell first (98.css + WinBox.js + taskbar), validate performance on Pi 4, then incrementally add application windows while monitoring memory consumption. Cross-compile using Docker for fast iteration, with periodic native builds on Pi hardware to catch platform-specific issues.