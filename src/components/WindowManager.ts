/**
 * Window Manager Component
 * Manages WinBox windows with Windows 2000 styling
 */

// WinBox window manager - import from source ESM
import WinBox from 'winbox/src/js/winbox.js';
import type { WindowConfig, WindowEvent, WindowEventType } from '../types';

// WinBox type augmentation
declare module 'winbox' {
  interface WinBox {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    min: boolean;
    max: boolean;
    hidden: boolean;
    focused: boolean;
    index: number;
  }
}

export class WindowManager {
  private windows: Map<string, WinBox> = new Map();
  private container: HTMLElement | null;
  private taskbarHeight: number = 28;
  private windowCounter: number = 0;

  // Event callbacks
  public onWindowOpen?: (event: WindowEvent) => void;
  public onWindowClose?: (event: WindowEvent) => void;
  public onWindowFocus?: (event: WindowEvent) => void;
  public onWindowBlur?: (event: WindowEvent) => void;
  public onWindowMinimize?: (event: WindowEvent) => void;
  public onWindowMaximize?: (event: WindowEvent) => void;
  public onWindowRestore?: (event: WindowEvent) => void;

  constructor() {
    this.container = document.getElementById('windows-container');
  }

  // ============================================================================
  // Window Creation
  // ============================================================================

  /**
   * Create a new window
   */
  public createWindow(config: WindowConfig): WinBox | null {
    const id = config.id || `window-${++this.windowCounter}`;

    // Check if window already exists
    if (this.windows.has(id)) {
      const existing = this.windows.get(id)!;
      this.focusWindow(id);
      return existing;
    }

    // Calculate default position (cascade from top-left)
    const existingCount = this.windows.size;
    const defaultX = 50 + (existingCount * 30);
    const defaultY = this.taskbarHeight + 20 + (existingCount * 30);

    // Calculate viewport bounds
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - this.taskbarHeight;

    // Create WinBox instance
    const winbox = new WinBox({
      id,
      title: config.title || 'Window',
      class: ['win2k-window'],

      // Dimensions
      width: config.width || 400,
      height: config.height || 300,
      x: config.x ?? defaultX,
      y: config.y ?? defaultY,

      // Constraints
      minwidth: config.minWidth || 200,
      minheight: config.minHeight || 150,

      // Viewport bounds (keep windows in visible area)
      top: this.taskbarHeight,
      right: 0,
      bottom: 0,
      left: 0,

      // Features
      modal: config.modal || false,

      // Content mounting
      mount: config.content instanceof HTMLElement ? config.content : undefined,
      html: typeof config.content === 'string' ? config.content : undefined,

      // Event handlers
      onfocus: () => {
        this.emitEvent('focus', id);
      },

      onblur: () => {
        this.emitEvent('blur', id);
      },

      onminimize: () => {
        this.emitEvent('minimize', id);
        return false; // Allow default behavior
      },

      onmaximize: () => {
        this.emitEvent('maximize', id);
        return false;
      },

      onrestore: () => {
        this.emitEvent('restore', id);
        return false;
      },

      onclose: () => {
        this.emitEvent('close', id);
        this.windows.delete(id);
        return false; // Allow default close behavior
      },

      onmove: () => {
        // TODO: Save window position for persistence
      },

      onresize: () => {
        // TODO: Save window size for persistence
      },
    });

    // Store window reference
    this.windows.set(id, winbox);
    this.emitEvent('open', id);

    return winbox;
  }

  // ============================================================================
  // Window Operations
  // ============================================================================

  /**
   * Close a window by ID
   */
  public closeWindow(id: string): boolean {
    const win = this.windows.get(id);
    if (win) {
      win.close();
      return true;
    }
    return false;
  }

  /**
   * Minimize a window
   */
  public minimizeWindow(id: string): boolean {
    const win = this.windows.get(id);
    if (win) {
      win.minimize();
      return true;
    }
    return false;
  }

  /**
   * Maximize a window
   */
  public maximizeWindow(id: string): boolean {
    const win = this.windows.get(id);
    if (win) {
      win.maximize();
      return true;
    }
    return false;
  }

  /**
   * Restore a minimized or maximized window
   */
  public restoreWindow(id: string): boolean {
    const win = this.windows.get(id);
    if (win) {
      win.restore();
      return true;
    }
    return false;
  }

  /**
   * Focus a window (bring to front)
   */
  public focusWindow(id: string): boolean {
    const win = this.windows.get(id);
    if (win) {
      win.focus();
      return true;
    }
    return false;
  }

  /**
   * Toggle window minimized state
   */
  public toggleMinimize(id: string): boolean {
    const win = this.windows.get(id);
    if (win) {
      if (win.min) {
        win.restore();
      } else {
        win.minimize();
      }
      return true;
    }
    return false;
  }

  /**
   * Check if a window is minimized
   */
  public isMinimized(id: string): boolean {
    const win = this.windows.get(id);
    return win?.min || false;
  }

  /**
   * Check if a window exists
   */
  public hasWindow(id: string): boolean {
    return this.windows.has(id);
  }

  /**
   * Get a window by ID
   */
  public getWindow(id: string): WinBox | undefined {
    return this.windows.get(id);
  }

  /**
   * Get all window IDs
   */
  public getWindowIds(): string[] {
    return Array.from(this.windows.keys());
  }

  /**
   * Close all windows
   */
  public closeAllWindows(): void {
    this.windows.forEach((win) => {
      win.close();
    });
    this.windows.clear();
  }

  // ============================================================================
  // Window Content Management
  // ============================================================================

  /**
   * Set window HTML content
   */
  public setWindowContent(id: string, content: string | HTMLElement): boolean {
    const win = this.windows.get(id);
    if (win) {
      const body = win.body;
      if (body) {
        if (typeof content === 'string') {
          body.innerHTML = content;
        } else {
          body.innerHTML = '';
          body.appendChild(content);
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Set window title
   */
  public setWindowTitle(id: string, title: string): boolean {
    const win = this.windows.get(id);
    if (win) {
      win.setTitle(title);
      return true;
    }
    return false;
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  private emitEvent(type: WindowEventType, windowId: string): void {
    const event: WindowEvent = {
      type,
      windowId,
      timestamp: Date.now(),
    };

    switch (type) {
      case 'open':
        this.onWindowOpen?.(event);
        break;
      case 'close':
        this.onWindowClose?.(event);
        break;
      case 'focus':
        this.onWindowFocus?.(event);
        break;
      case 'blur':
        this.onWindowBlur?.(event);
        break;
      case 'minimize':
        this.onWindowMinimize?.(event);
        break;
      case 'maximize':
        this.onWindowMaximize?.(event);
        break;
      case 'restore':
        this.onWindowRestore?.(event);
        break;
    }

    // Dispatch DOM event for external listeners
    document.dispatchEvent(new CustomEvent('window-event', { detail: event }));
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.closeAllWindows();
  }
}

// ============================================================================
// TODO: Future Enhancements
// ============================================================================

// TODO: Add window position/size persistence
// TODO: Add window snapping to edges
// TODO: Add window cascade/tile arrangements
// TODO: Add window groups/layers
// TODO: Add modal dialog support
