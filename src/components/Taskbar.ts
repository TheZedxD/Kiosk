/**
 * Taskbar Component
 * Windows 2000 style taskbar with Start button, programs, and system tray
 */

import { getLocalDateTime } from '../utils/api';
import type { DateTimeInfo, TaskbarItem } from '../types';

export class Taskbar {
  private clockElement: HTMLElement | null;
  private clockTimeElement: HTMLElement | null;
  private tooltipElement: HTMLElement | null;
  private tooltipDateElement: HTMLElement | null;
  private startButton: HTMLElement | null;
  private startMenu: HTMLElement | null;
  private startMenuItems: HTMLElement | null;
  private programsContainer: HTMLElement | null;

  private clockInterval: number | null = null;
  private isStartMenuOpen: boolean = false;
  private taskbarItems: Map<string, TaskbarItem> = new Map();

  private handleStartButtonClick?: (e: MouseEvent) => void;
  private handleMenuClick?: (e: MouseEvent) => void;
  private handleClickOutside?: (e: MouseEvent) => void;
  private handleClockEnter?: (e: MouseEvent) => void;
  private handleClockMove?: (e: MouseEvent) => void;
  private handleClockLeave?: () => void;

  constructor() {
    this.clockElement = document.getElementById('clock');
    this.clockTimeElement = document.getElementById('clock-time');
    this.tooltipElement = document.getElementById('datetime-tooltip');
    this.tooltipDateElement = document.getElementById('tooltip-date');
    this.startButton = document.getElementById('start-button');
    this.startMenu = document.getElementById('start-menu');
    this.startMenuItems = document.getElementById('start-menu-items');
    this.programsContainer = document.getElementById('taskbar-programs');

    this.init();
  }

  private init(): void {
    this.setupClock();
    this.setupStartButton();
    this.setupClockTooltip();
    this.setupClickOutside();
  }

  // ============================================================================
  // Clock Management
  // ============================================================================

  private setupClock(): void {
    // Initial update
    this.updateClock();

    // Update every second
    this.clockInterval = window.setInterval(() => {
      this.updateClock();
    }, 1000);
  }

  private updateClock(): void {
    try {
      const dateTime: DateTimeInfo = getLocalDateTime();

      if (this.clockTimeElement) {
        this.clockTimeElement.textContent = dateTime.time_12h;
      }

      if (this.tooltipDateElement) {
        this.tooltipDateElement.textContent = `${dateTime.day_of_week}, ${dateTime.date_long}`;
      }
    } catch (error) {
      console.error('Failed to update clock:', error);
      // Use local fallback on error
      const fallback = getLocalDateTime();
      if (this.clockTimeElement) {
        this.clockTimeElement.textContent = fallback.time_12h;
      }
    }
  }

  private setupClockTooltip(): void {
    if (!this.clockElement || !this.tooltipElement) return;

    this.handleClockEnter = (e: MouseEvent) => {
      if (this.tooltipElement) {
        this.tooltipElement.style.display = 'block';
        this.positionTooltip(e);
      }
    };

    this.handleClockMove = (e: MouseEvent) => this.positionTooltip(e);

    this.handleClockLeave = () => {
      if (this.tooltipElement) {
        this.tooltipElement.style.display = 'none';
      }
    };

    this.clockElement.addEventListener('mouseenter', this.handleClockEnter);
    this.clockElement.addEventListener('mousemove', this.handleClockMove);
    this.clockElement.addEventListener('mouseleave', this.handleClockLeave);
  }

  private positionTooltip(e: MouseEvent): void {
    if (!this.tooltipElement) return;

    const rect = this.tooltipElement.getBoundingClientRect();
    const x = e.clientX + 10;
    const y = e.clientY + 20;

    // Keep tooltip on screen
    const maxX = window.innerWidth - rect.width - 10;
    const maxY = window.innerHeight - rect.height - 10;

    this.tooltipElement.style.left = Math.min(x, maxX) + 'px';
    this.tooltipElement.style.top = Math.min(y, maxY) + 'px';
  }

  // ============================================================================
  // Start Menu Management
  // ============================================================================

  private setupStartButton(): void {
    if (!this.startButton) return;

    this.handleStartButtonClick = (e: MouseEvent) => {
      e.stopPropagation();
      this.toggleStartMenu();
    };

    this.startButton.addEventListener('click', this.handleStartButtonClick);

    if (this.startMenuItems) {
      this.handleMenuClick = (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest('.menu-item[data-action]') as HTMLElement | null;
        if (!target) return;
        const action = target.dataset.action;
        if (action) {
          this.handleMenuAction(action);
        }
        this.closeStartMenu();
      };

      this.startMenuItems.addEventListener('click', this.handleMenuClick);
    }
  }

  private setupClickOutside(): void {
    this.handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Close start menu if clicking outside
      if (this.isStartMenuOpen &&
          !this.startButton?.contains(target) &&
          !this.startMenu?.contains(target)) {
        this.closeStartMenu();
      }
    };

    document.addEventListener('click', this.handleClickOutside);
  }

  public toggleStartMenu(): void {
    if (this.isStartMenuOpen) {
      this.closeStartMenu();
    } else {
      this.openStartMenu();
    }
  }

  public openStartMenu(): void {
    if (this.startMenu) {
      this.startMenu.style.display = 'flex';
      this.isStartMenuOpen = true;

      // Add pressed state to start button
      this.startButton?.classList.add('active');
    }
  }

  public closeStartMenu(): void {
    if (this.startMenu) {
      this.startMenu.style.display = 'none';
      this.isStartMenuOpen = false;

      // Remove pressed state from start button
      this.startButton?.classList.remove('active');
    }
  }

  private handleMenuAction(action: string): void {
    // Emit custom event for the desktop to handle
    const event = new CustomEvent('menu-action', {
      detail: { action },
      bubbles: true,
    });
    document.dispatchEvent(event);
  }

  // ============================================================================
  // Taskbar Programs Management
  // ============================================================================

  /**
   * Add a program to the taskbar
   */
  public addProgram(item: TaskbarItem): void {
    if (!this.programsContainer) return;

    // Store the item
    this.taskbarItems.set(item.id, item);

    // Create the taskbar button
    const button = document.createElement('button');
    button.id = `taskbar-${item.id}`;
    button.className = `taskbar-program${item.active ? ' active' : ''}`;

    button.innerHTML = `
      <span class="program-icon"></span>
      <span class="program-title">${this.escapeHtml(item.title)}</span>
    `;

    button.addEventListener('click', () => {
      const event = new CustomEvent('taskbar-click', {
        detail: { windowId: item.windowId },
        bubbles: true,
      });
      document.dispatchEvent(event);
    });

    this.programsContainer.appendChild(button);
  }

  /**
   * Remove a program from the taskbar
   */
  public removeProgram(id: string): void {
    const button = document.getElementById(`taskbar-${id}`);
    if (button) {
      button.remove();
    }
    this.taskbarItems.delete(id);
  }

  /**
   * Update a program's active state
   */
  public setActiveProgram(id: string, active: boolean): void {
    const item = this.taskbarItems.get(id);
    if (item) {
      item.active = active;
    }

    const button = document.getElementById(`taskbar-${id}`);
    if (button) {
      if (active) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    }
  }

  /**
   * Update a program's title
   */
  public updateProgramTitle(id: string, title: string): void {
    const item = this.taskbarItems.get(id);
    if (item) {
      item.title = title;
    }

    const button = document.getElementById(`taskbar-${id}`);
    if (button) {
      const titleSpan = button.querySelector('.program-title');
      if (titleSpan) {
        titleSpan.textContent = title;
      }
    }
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
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }

    if (this.startButton && this.handleStartButtonClick) {
      this.startButton.removeEventListener('click', this.handleStartButtonClick);
    }

    if (this.startMenuItems && this.handleMenuClick) {
      this.startMenuItems.removeEventListener('click', this.handleMenuClick);
    }

    if (this.handleClickOutside) {
      document.removeEventListener('click', this.handleClickOutside);
    }

    if (this.clockElement) {
      if (this.handleClockEnter) {
        this.clockElement.removeEventListener('mouseenter', this.handleClockEnter);
      }
      if (this.handleClockMove) {
        this.clockElement.removeEventListener('mousemove', this.handleClockMove);
      }
      if (this.handleClockLeave) {
        this.clockElement.removeEventListener('mouseleave', this.handleClockLeave);
      }
    }
  }
}
