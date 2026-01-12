/**
 * Kiosk API Utilities
 * Wrapper around Tauri invoke commands
 */

import { invoke } from '@tauri-apps/api/core';
import type { SystemStats, HardwareProfile, DateTimeInfo, DriveInfo } from '../types';

// ============================================================================
// System Commands
// ============================================================================

/**
 * Get current system statistics (CPU, memory)
 */
export async function getSystemStats(): Promise<SystemStats> {
  return invoke<SystemStats>('get_system_stats');
}

/**
 * Get hardware profile information
 */
export async function getHardwareProfile(): Promise<HardwareProfile> {
  return invoke<HardwareProfile>('get_hardware_profile');
}

/**
 * Get current date/time formatted for display
 */
export async function getDateTime(): Promise<DateTimeInfo> {
  return invoke<DateTimeInfo>('get_datetime');
}

/**
 * List available drives/disks
 */
export async function listDrives(): Promise<DriveInfo[]> {
  return invoke<DriveInfo[]>('list_drives');
}

/**
 * Test backend connectivity
 */
export async function greet(name: string): Promise<string> {
  return invoke<string>('greet', { name });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format percentage with fixed decimals
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return value.toFixed(decimals) + '%';
}

// ============================================================================
// Fallback Functions (for browser-only testing)
// ============================================================================

/**
 * Check if running in Tauri environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Get date/time using JavaScript fallback
 */
export function getLocalDateTime(): DateTimeInfo {
  const now = new Date();

  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;

  return {
    time_12h: `${hours12}:${minutes} ${ampm}`,
    time_24h: `${hours.toString().padStart(2, '0')}:${minutes}`,
    date_short: now.toLocaleDateString('en-US'),
    date_long: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    day_of_week: now.toLocaleDateString('en-US', { weekday: 'long' }),
    timestamp: now.getTime(),
  };
}

// ============================================================================
// TODO: Future API Functions
// ============================================================================

// TODO: Add file operations
// export async function readDirectory(path: string): Promise<FileEntry[]> { }
// export async function copyFile(src: string, dest: string): Promise<void> { }
// export async function deleteFile(path: string): Promise<void> { }

// TODO: Add terminal operations
// export async function spawnTerminal(cols: number, rows: number): Promise<TerminalSession> { }
// export async function writeTerminal(id: string, data: string): Promise<void> { }

// TODO: Add USB monitoring
// export function watchUsbDevices(callback: (drives: DriveInfo[]) => void): void { }
