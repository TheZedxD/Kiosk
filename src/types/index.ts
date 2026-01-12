/**
 * Kiosk Type Definitions
 * Shared types for the application
 */

// ============================================================================
// System Types (from Rust backend)
// ============================================================================

export interface SystemStats {
  cpu_usage: number;
  total_memory: number;
  used_memory: number;
  available_memory: number;
  cpu_count: number;
}

export interface HardwareProfile {
  model: string;
  ram_mb: number;
  os_name: string;
  os_version: string;
  hostname: string;
}

export interface DateTimeInfo {
  time_12h: string;
  time_24h: string;
  date_short: string;
  date_long: string;
  day_of_week: string;
  timestamp: number;
}

export interface DriveInfo {
  name: string;
  mount_point: string;
  total_space: number;
  available_space: number;
  is_removable: boolean;
}

// ============================================================================
// Desktop Types
// ============================================================================

export interface DesktopIcon {
  id: string;
  label: string;
  icon: string;
  action: string;
  x?: number;
  y?: number;
}

export interface WindowConfig {
  id: string;
  title: string;
  icon?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  closable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  modal?: boolean;
  content?: string | HTMLElement;
}

export interface TaskbarItem {
  id: string;
  title: string;
  icon?: string;
  windowId: string;
  active: boolean;
}

// ============================================================================
// Application Types
// ============================================================================

export type StartMenuGroup = 'primary' | 'secondary' | 'power';

export interface AppDefinition {
  id: string;
  title: string;
  icon: string;
  startMenuGroup?: StartMenuGroup;
  showOnDesktop: boolean;
  launch: () => WindowConfig | Promise<WindowConfig>;
}

// ============================================================================
// Event Types
// ============================================================================

export type WindowEventType = 'open' | 'close' | 'minimize' | 'maximize' | 'restore' | 'focus' | 'blur';

export interface WindowEvent {
  type: WindowEventType;
  windowId: string;
  timestamp: number;
}

export type MenuAction = string;

// ============================================================================
// TODO: Future Types
// ============================================================================

// TODO: Add file browser types
// export interface FileEntry {
//   name: string;
//   path: string;
//   isDirectory: boolean;
//   size: number;
//   modified: number;
// }

// TODO: Add terminal types
// export interface TerminalSession {
//   id: string;
//   pid: number;
//   cols: number;
//   rows: number;
// }
