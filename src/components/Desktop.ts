/**
 * Desktop Component
 * Main desktop environment manager
 */

import { Taskbar } from './Taskbar';
import { WindowManager } from './WindowManager';
import type { DesktopIcon, MenuAction, TaskbarItem } from '../types';

export class Desktop {
  private taskbar: Taskbar;
  private windowManager: WindowManager;
  private iconsContainer: HTMLElement | null;
  private desktopElement: HTMLElement | null;

  private icons: Map<string, DesktopIcon> = new Map();
  private selectedIcon: string | null = null;

  constructor() {
    this.desktopElement = document.getElementById('desktop');
    this.iconsContainer = document.getElementById('desktop-icons');

    // Initialize components
    this.taskbar = new Taskbar();
    this.windowManager = new WindowManager();

    this.init();
  }

  private init(): void {
    this.setupWindowManagerEvents();
    this.setupDesktopEvents();
    this.setupMenuActions();
    this.createDefaultIcons();
  }

  // ============================================================================
  // Default Desktop Icons
  // ============================================================================

  private createDefaultIcons(): void {
    // Add default desktop icons
    // TODO: Replace with actual icon images
    this.addIcon({
      id: 'my-computer',
      label: 'My Computer',
      icon: 'computer',
      action: 'my-computer',
    });

    this.addIcon({
      id: 'my-documents',
      label: 'My Documents',
      icon: 'folder',
      action: 'my-documents',
    });

    this.addIcon({
      id: 'recycle-bin',
      label: 'Recycle Bin',
      icon: 'trash',
      action: 'recycle-bin',
    });

    // TODO: Add more default icons as features are implemented
    // - Network Neighborhood
    // - Internet Explorer
    // - Notepad
    // - Command Prompt
  }

  // ============================================================================
  // Icon Management
  // ============================================================================

  public addIcon(icon: DesktopIcon): void {
    if (!this.iconsContainer) return;

    this.icons.set(icon.id, icon);

    const element = document.createElement('div');
    element.id = `icon-${icon.id}`;
    element.className = 'desktop-icon';
    element.dataset.action = icon.action;

    element.innerHTML = `
      <div class="icon-image icon-${icon.icon}"></div>
      <span class="icon-label">${this.escapeHtml(icon.label)}</span>
    `;

    // Single click to select
    element.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectIcon(icon.id);
    });

    // Double click to open
    element.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.activateIcon(icon.id);
    });

    this.iconsContainer.appendChild(element);
  }

  public removeIcon(id: string): void {
    const element = document.getElementById(`icon-${id}`);
    if (element) {
      element.remove();
    }
    this.icons.delete(id);
  }

  private selectIcon(id: string): void {
    // Deselect previous
    if (this.selectedIcon) {
      const prev = document.getElementById(`icon-${this.selectedIcon}`);
      prev?.classList.remove('selected');
    }

    // Select new
    const element = document.getElementById(`icon-${id}`);
    element?.classList.add('selected');
    this.selectedIcon = id;
  }

  private deselectAllIcons(): void {
    if (this.selectedIcon) {
      const prev = document.getElementById(`icon-${this.selectedIcon}`);
      prev?.classList.remove('selected');
      this.selectedIcon = null;
    }
  }

  private activateIcon(id: string): void {
    const icon = this.icons.get(id);
    if (icon) {
      this.handleMenuAction(icon.action as MenuAction);
    }
  }

  // ============================================================================
  // Window Manager Events
  // ============================================================================

  private setupWindowManagerEvents(): void {
    // When a window opens, add it to the taskbar
    this.windowManager.onWindowOpen = (event) => {
      const win = this.windowManager.getWindow(event.windowId);
      if (win) {
        const item: TaskbarItem = {
          id: event.windowId,
          title: (win as any).title || 'Window',
          windowId: event.windowId,
          active: true,
        };
        this.taskbar.addProgram(item);
      }
    };

    // When a window closes, remove from taskbar
    this.windowManager.onWindowClose = (event) => {
      this.taskbar.removeProgram(event.windowId);
    };

    // When a window gains focus, update taskbar
    this.windowManager.onWindowFocus = (event) => {
      this.taskbar.setActiveProgram(event.windowId, true);
    };

    // When a window loses focus, update taskbar
    this.windowManager.onWindowBlur = (event) => {
      this.taskbar.setActiveProgram(event.windowId, false);
    };

    // Handle taskbar click events
    document.addEventListener('taskbar-click', ((e: CustomEvent) => {
      const { windowId } = e.detail;

      if (this.windowManager.isMinimized(windowId)) {
        this.windowManager.restoreWindow(windowId);
      }
      this.windowManager.focusWindow(windowId);
    }) as EventListener);
  }

  // ============================================================================
  // Desktop Events
  // ============================================================================

  private setupDesktopEvents(): void {
    // Click on desktop to deselect icons
    this.iconsContainer?.addEventListener('click', (e) => {
      if (e.target === this.iconsContainer) {
        this.deselectAllIcons();
      }
    });

    // Right-click context menu (TODO: implement)
    this.desktopElement?.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // TODO: Show desktop context menu
      console.log('Desktop context menu at', e.clientX, e.clientY);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboard(e);
    });
  }

  private handleKeyboard(e: KeyboardEvent): void {
    // Windows key or Ctrl+Esc to toggle start menu
    if (e.key === 'Meta' || (e.ctrlKey && e.key === 'Escape')) {
      e.preventDefault();
      this.taskbar.toggleStartMenu();
    }

    // Delete selected icon (recycle bin)
    if (e.key === 'Delete' && this.selectedIcon) {
      // TODO: Implement delete functionality
      console.log('Delete icon:', this.selectedIcon);
    }

    // Enter to activate selected icon
    if (e.key === 'Enter' && this.selectedIcon) {
      this.activateIcon(this.selectedIcon);
    }

    // Escape to close start menu
    if (e.key === 'Escape') {
      this.taskbar.closeStartMenu();
    }
  }

  // ============================================================================
  // Menu Actions
  // ============================================================================

  private setupMenuActions(): void {
    document.addEventListener('menu-action', ((e: CustomEvent) => {
      this.handleMenuAction(e.detail.action as MenuAction);
    }) as EventListener);
  }

  private handleMenuAction(action: MenuAction | string): void {
    switch (action) {
      case 'my-computer':
        this.openMyComputer();
        break;

      case 'my-documents':
        this.openMyDocuments();
        break;

      case 'settings':
        this.openSettings();
        break;

      case 'run':
        this.openRunDialog();
        break;

      case 'shutdown':
        this.showShutdownDialog();
        break;

      case 'recycle-bin':
        this.openRecycleBin();
        break;

      default:
        console.log('Unknown action:', action);
    }
  }

  // ============================================================================
  // Window Openers
  // ============================================================================

  private openMyComputer(): void {
    const content = document.createElement('div');
    content.className = 'window-content file-browser';
    content.innerHTML = `
      <div class="window-toolbar">
        <button class="button">Back</button>
        <button class="button">Forward</button>
        <button class="button">Up</button>
      </div>
      <div class="window-address-bar">
        <label>Address:</label>
        <input type="text" value="My Computer" readonly />
      </div>
      <div class="window-body" style="background: white; padding: 8px;">
        <p style="color: #808080; font-style: italic;">
          <!-- TODO: Display drives here -->
          File browser coming in Phase 2...
        </p>
      </div>
    `;

    this.windowManager.createWindow({
      id: 'my-computer',
      title: 'My Computer',
      width: 600,
      height: 400,
      content,
    });
  }

  private openMyDocuments(): void {
    const content = document.createElement('div');
    content.className = 'window-content file-browser';
    content.innerHTML = `
      <div class="window-toolbar">
        <button class="button">Back</button>
        <button class="button">Forward</button>
        <button class="button">Up</button>
      </div>
      <div class="window-address-bar">
        <label>Address:</label>
        <input type="text" value="My Documents" readonly />
      </div>
      <div class="window-body" style="background: white; padding: 8px;">
        <p style="color: #808080; font-style: italic;">
          <!-- TODO: Display files here -->
          File browser coming in Phase 2...
        </p>
      </div>
    `;

    this.windowManager.createWindow({
      id: 'my-documents',
      title: 'My Documents',
      width: 600,
      height: 400,
      content,
    });
  }

  private openSettings(): void {
    const content = document.createElement('div');
    content.className = 'window-content settings-panel';
    content.innerHTML = `
      <div style="padding: 16px;">
        <fieldset>
          <legend>Display Settings</legend>
          <p style="color: #808080; font-style: italic;">
            <!-- TODO: Add settings controls -->
            Settings panel coming in Phase 2...
          </p>
        </fieldset>
      </div>
    `;

    this.windowManager.createWindow({
      id: 'settings',
      title: 'Settings',
      width: 400,
      height: 300,
      content,
    });
  }

  private openRunDialog(): void {
    const content = document.createElement('div');
    content.className = 'window-content run-dialog';
    content.innerHTML = `
      <div style="padding: 16px;">
        <p>Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.</p>
        <div style="margin-top: 16px;">
          <label for="run-input">Open:</label>
          <input type="text" id="run-input" style="width: 100%; margin-top: 4px;" />
        </div>
        <div style="margin-top: 16px; text-align: right;">
          <button class="button" style="min-width: 75px;">OK</button>
          <button class="button" style="min-width: 75px; margin-left: 8px;">Cancel</button>
          <button class="button" style="min-width: 75px; margin-left: 8px;">Browse...</button>
        </div>
      </div>
    `;

    this.windowManager.createWindow({
      id: 'run-dialog',
      title: 'Run',
      width: 400,
      height: 180,
      resizable: false,
      content,
    });
  }

  private openRecycleBin(): void {
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="padding: 16px; background: white; height: 100%;">
        <p style="color: #808080; font-style: italic; text-align: center; margin-top: 40px;">
          Recycle Bin is empty
        </p>
      </div>
    `;

    this.windowManager.createWindow({
      id: 'recycle-bin',
      title: 'Recycle Bin',
      width: 500,
      height: 350,
      content,
    });
  }

  private showShutdownDialog(): void {
    const content = document.createElement('div');
    content.className = 'window-content shutdown-dialog';
    content.innerHTML = `
      <div style="padding: 16px; text-align: center;">
        <p style="margin-bottom: 16px;">What do you want the computer to do?</p>
        <select style="width: 200px; margin-bottom: 16px;">
          <option>Shut down</option>
          <option>Restart</option>
          <option>Log off</option>
        </select>
        <div style="margin-top: 16px;">
          <button class="button" style="min-width: 75px;">OK</button>
          <button class="button" style="min-width: 75px; margin-left: 8px;"
                  onclick="document.dispatchEvent(new CustomEvent('close-window', {detail: {id: 'shutdown-dialog'}}))">
            Cancel
          </button>
        </div>
        <p style="margin-top: 16px; color: #808080; font-size: 10px;">
          (This is a demo - shutdown is not implemented)
        </p>
      </div>
    `;

    this.windowManager.createWindow({
      id: 'shutdown-dialog',
      title: 'Shut Down Windows',
      width: 300,
      height: 220,
      resizable: false,
      modal: true,
      content,
    });
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get the window manager instance
   */
  public getWindowManager(): WindowManager {
    return this.windowManager;
  }

  /**
   * Get the taskbar instance
   */
  public getTaskbar(): Taskbar {
    return this.taskbar;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.taskbar.destroy();
    this.windowManager.destroy();
  }
}

// ============================================================================
// TODO: Future Enhancements
// ============================================================================

// TODO: Add drag-and-drop icon arrangement
// TODO: Add icon grid snapping
// TODO: Add desktop context menu
// TODO: Add wallpaper support
// TODO: Add theme switching
// TODO: Add icon double-click timeout
