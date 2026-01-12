/**
 * Kiosk Application Entry Point
 *
 * Windows 2000 style desktop environment
 * Built with Tauri, 98.css, and WinBox.js
 */

import { Desktop } from './components/Desktop';
import { isTauri, getHardwareProfile, getSystemStats } from './utils/api';

// Import WinBox CSS
import 'winbox/dist/css/winbox.min.css';

// ============================================================================
// Application State
// ============================================================================

interface AppState {
  desktop: Desktop | null;
  initialized: boolean;
}

const state: AppState = {
  desktop: null,
  initialized: false,
};

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the application
 */
async function init(): Promise<void> {
  console.log('Kiosk: Initializing...');

  try {
    // Create desktop environment
    state.desktop = new Desktop();
    state.initialized = true;

    console.log('Kiosk: Desktop initialized');

    // Log system info if running in Tauri
    if (isTauri()) {
      await logSystemInfo();
    } else {
      console.log('Kiosk: Running in browser mode (no Tauri backend)');
    }

    // Emit ready event
    document.dispatchEvent(new CustomEvent('kiosk-ready'));

  } catch (error) {
    console.error('Kiosk: Initialization failed:', error);
    showErrorScreen(error as Error);
  }
}

/**
 * Log system information on startup
 */
async function logSystemInfo(): Promise<void> {
  try {
    const profile = await getHardwareProfile();
    const stats = await getSystemStats();

    console.log('Kiosk: System Information');
    console.log(`  Model: ${profile.model}`);
    console.log(`  OS: ${profile.os_name} ${profile.os_version}`);
    console.log(`  Hostname: ${profile.hostname}`);
    console.log(`  RAM: ${profile.ram_mb} MB`);
    console.log(`  CPU Usage: ${stats.cpu_usage.toFixed(1)}%`);
    console.log(`  Memory Used: ${Math.round(stats.used_memory / 1024 / 1024)} MB`);

  } catch (error) {
    console.warn('Kiosk: Could not fetch system info:', error);
  }
}

/**
 * Show error screen if initialization fails
 */
function showErrorScreen(error: Error): void {
  const desktop = document.getElementById('desktop');
  if (desktop) {
    desktop.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: white;
        text-align: center;
        font-family: Tahoma, sans-serif;
      ">
        <h1 style="color: #ff6666;">Initialization Error</h1>
        <p>The kiosk application failed to start.</p>
        <pre style="
          background: rgba(0,0,0,0.5);
          padding: 16px;
          border-radius: 4px;
          max-width: 80%;
          overflow: auto;
        ">${error.message}</pre>
        <button onclick="location.reload()" style="
          margin-top: 16px;
          padding: 8px 24px;
          font-size: 14px;
        ">Reload</button>
      </div>
    `;
  }
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Clean up resources on unload
 */
function cleanup(): void {
  if (state.desktop) {
    state.desktop.destroy();
    state.desktop = null;
  }
  state.initialized = false;
  console.log('Kiosk: Cleaned up');
}

// ============================================================================
// Event Listeners
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cleanup on unload
window.addEventListener('beforeunload', cleanup);

// Prevent accidental navigation
window.addEventListener('beforeunload', (e) => {
  // Only in production
  if (import.meta.env.PROD) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ============================================================================
// Global Error Handling
// ============================================================================

window.addEventListener('error', (e) => {
  console.error('Kiosk: Uncaught error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Kiosk: Unhandled promise rejection:', e.reason);
});

// ============================================================================
// Development Helpers
// ============================================================================

// Expose app state for debugging in development
if (import.meta.env.DEV) {
  (window as any).kiosk = {
    get state() { return state; },
    get desktop() { return state.desktop; },
    get windowManager() { return state.desktop?.getWindowManager(); },
    get taskbar() { return state.desktop?.getTaskbar(); },
  };
}

// ============================================================================
// TODO: Future Enhancements
// ============================================================================

// TODO: Add service worker for offline support
// TODO: Add application state persistence
// TODO: Add crash recovery
// TODO: Add performance monitoring
// TODO: Add remote logging/telemetry
