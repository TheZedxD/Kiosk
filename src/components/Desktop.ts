/**
 * Desktop Component
 * Main desktop environment manager
 */

import { Taskbar } from './Taskbar';
import { WindowManager } from './WindowManager';
import { AppRegistry } from './AppRegistry';
import { coreApps } from '../apps/coreApps';
import type { AppDefinition, DesktopIcon, StartMenuGroup, TaskbarItem } from '../types';

export class Desktop {
  private taskbar: Taskbar;
  private windowManager: WindowManager;
  private appRegistry: AppRegistry;
  private iconsContainer: HTMLElement | null;
  private desktopElement: HTMLElement | null;
  private startMenuItems: HTMLElement | null;

  private icons: Map<string, DesktopIcon> = new Map();
  private selectedIcon: string | null = null;

  private handleTaskbarClick?: (e: CustomEvent) => void;
  private handleMenuActionEvent?: (e: CustomEvent) => void;
  private handleCloseWindowEvent?: (e: CustomEvent) => void;
  private handleDesktopClick?: (e: MouseEvent) => void;
  private handleContextMenu?: (e: MouseEvent) => void;
  private handleKeydown?: (e: KeyboardEvent) => void;

  constructor() {
    this.desktopElement = document.getElementById('desktop');
    this.iconsContainer = document.getElementById('desktop-icons');
    this.startMenuItems = document.getElementById('start-menu-items');

    // Initialize components
    this.taskbar = new Taskbar();
    this.windowManager = new WindowManager();
    this.appRegistry = new AppRegistry(this.windowManager);

    this.init();
  }

  private init(): void {
    this.setupWindowManagerEvents();
    this.setupDesktopEvents();
    this.setupMenuActions();
    this.registerCoreApps();
    this.renderStartMenu();
    this.createDesktopIcons();
  }

  // ============================================================================
  // Application Registration
  // ============================================================================

  private registerCoreApps(): void {
    this.appRegistry.registerAll(coreApps);
  }

  private renderStartMenu(): void {
    if (!this.startMenuItems) return;

    this.startMenuItems.innerHTML = '';

    const apps = this.appRegistry.getStartMenuApps();
    const grouped = new Map<string, AppDefinition[]>();

    apps.forEach((app) => {
      const group = app.startMenuGroup || 'primary';
      if (!grouped.has(group)) {
        grouped.set(group, []);
      }
      grouped.get(group)?.push(app);
    });

    const groupOrder: StartMenuGroup[] = ['primary', 'secondary', 'power'];
    let firstGroupRendered = false;

    groupOrder.forEach((group) => {
      const groupApps = grouped.get(group) ?? [];
      if (groupApps.length === 0) return;

      if (firstGroupRendered) {
        const separator = document.createElement('li');
        separator.className = 'menu-separator';
        this.startMenuItems?.appendChild(separator);
      }

      groupApps.forEach((app) => {
        this.startMenuItems?.appendChild(this.createMenuItem(app));
      });

      firstGroupRendered = true;
    });
  }

  private createMenuItem(app: AppDefinition): HTMLElement {
    const item = document.createElement('li');
    item.className = 'menu-item';
    item.dataset.action = app.id;
    item.innerHTML = `
      <span class="menu-icon icon-${app.icon}"></span>
      <span class="menu-text">${this.escapeHtml(app.title)}</span>
    `;
    return item;
  }

  private createDesktopIcons(): void {
    this.appRegistry.getDesktopApps().forEach((app) => {
      this.addIcon({
        id: app.id,
        label: app.title,
        icon: app.icon,
        action: app.id,
      });
    });
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
      void this.handleMenuAction(icon.action);
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

    this.handleTaskbarClick = (e: CustomEvent) => {
      const { windowId } = e.detail;

      if (this.windowManager.isMinimized(windowId)) {
        this.windowManager.restoreWindow(windowId);
      }
      this.windowManager.focusWindow(windowId);
    };

    document.addEventListener('taskbar-click', this.handleTaskbarClick as EventListener);
  }

  // ============================================================================
  // Desktop Events
  // ============================================================================

  private setupDesktopEvents(): void {
    // Click on desktop to deselect icons
    this.handleDesktopClick = (e: MouseEvent) => {
      if (e.target === this.iconsContainer) {
        this.deselectAllIcons();
      }
    };

    this.iconsContainer?.addEventListener('click', this.handleDesktopClick);

    // Right-click context menu (TODO: implement)
    this.handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      // TODO: Show desktop context menu
      console.log('Desktop context menu at', e.clientX, e.clientY);
    };

    this.desktopElement?.addEventListener('contextmenu', this.handleContextMenu);

    // Keyboard shortcuts
    this.handleKeydown = (e: KeyboardEvent) => this.handleKeyboard(e);
    document.addEventListener('keydown', this.handleKeydown);
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
    this.handleMenuActionEvent = (e: CustomEvent) => {
      void this.handleMenuAction(e.detail.action);
    };

    this.handleCloseWindowEvent = (e: CustomEvent) => {
      const { id } = e.detail || {};
      if (typeof id === 'string') {
        this.windowManager.closeWindow(id);
      }
    };

    document.addEventListener('menu-action', this.handleMenuActionEvent as EventListener);
    document.addEventListener('close-window', this.handleCloseWindowEvent as EventListener);
  }

  private async handleMenuAction(action: string): Promise<void> {
    const launched = await this.appRegistry.launch(action);
    if (!launched) {
      console.log('Unknown action:', action);
    }
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

    if (this.handleTaskbarClick) {
      document.removeEventListener('taskbar-click', this.handleTaskbarClick as EventListener);
    }

    if (this.handleMenuActionEvent) {
      document.removeEventListener('menu-action', this.handleMenuActionEvent as EventListener);
    }

    if (this.handleCloseWindowEvent) {
      document.removeEventListener('close-window', this.handleCloseWindowEvent as EventListener);
    }

    if (this.iconsContainer && this.handleDesktopClick) {
      this.iconsContainer.removeEventListener('click', this.handleDesktopClick);
    }

    if (this.desktopElement && this.handleContextMenu) {
      this.desktopElement.removeEventListener('contextmenu', this.handleContextMenu);
    }

    if (this.handleKeydown) {
      document.removeEventListener('keydown', this.handleKeydown);
    }
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
