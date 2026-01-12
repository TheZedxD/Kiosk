//! Kiosk Application Backend
//!
//! This module provides the Rust backend for the Windows 2000 style kiosk application.
//! It handles system information, file operations, and other native functionality.

use serde::{Deserialize, Serialize};
use sysinfo::System;
use chrono::{Local, Datelike, Timelike};

// ============================================================================
// Data Structures
// ============================================================================

/// System statistics for the system monitor
#[derive(Debug, Serialize, Deserialize)]
pub struct SystemStats {
    pub cpu_usage: f32,
    pub total_memory: u64,
    pub used_memory: u64,
    pub available_memory: u64,
    pub cpu_count: usize,
    // TODO: Add temperature readings for Raspberry Pi
    // pub temperatures: Vec<(String, f32)>,
}

/// Hardware profile information
#[derive(Debug, Serialize, Deserialize)]
pub struct HardwareProfile {
    pub model: String,
    pub ram_mb: u64,
    pub os_name: String,
    pub os_version: String,
    pub hostname: String,
}

/// Date and time information for the taskbar clock
#[derive(Debug, Serialize, Deserialize)]
pub struct DateTimeInfo {
    pub time_12h: String,
    pub time_24h: String,
    pub date_short: String,
    pub date_long: String,
    pub day_of_week: String,
    pub timestamp: i64,
}

/// Drive information for file manager
#[derive(Debug, Serialize, Deserialize)]
pub struct DriveInfo {
    pub name: String,
    pub mount_point: String,
    pub total_space: u64,
    pub available_space: u64,
    pub is_removable: bool,
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Get current system statistics (CPU, memory usage)
#[tauri::command]
fn get_system_stats() -> SystemStats {
    let mut sys = System::new_all();
    sys.refresh_all();

    SystemStats {
        cpu_usage: sys.global_cpu_usage(),
        total_memory: sys.total_memory(),
        used_memory: sys.used_memory(),
        available_memory: sys.available_memory(),
        cpu_count: sys.cpus().len(),
    }
}

/// Get hardware profile information
#[tauri::command]
fn get_hardware_profile() -> HardwareProfile {
    // Try to read Pi model from device tree (Linux-specific)
    let model = std::fs::read_to_string("/sys/firmware/devicetree/base/model")
        .unwrap_or_else(|_| "Desktop Computer".to_string())
        .trim_matches('\0')
        .to_string();

    let sys = System::new_all();

    HardwareProfile {
        model,
        ram_mb: sys.total_memory() / 1024 / 1024,
        os_name: System::name().unwrap_or_else(|| "Unknown".to_string()),
        os_version: System::os_version().unwrap_or_else(|| "Unknown".to_string()),
        hostname: System::host_name().unwrap_or_else(|| "localhost".to_string()),
    }
}

/// Get current date and time formatted for display
#[tauri::command]
fn get_datetime() -> DateTimeInfo {
    let now = Local::now();

    DateTimeInfo {
        time_12h: now.format("%I:%M %p").to_string(),
        time_24h: now.format("%H:%M").to_string(),
        date_short: now.format("%m/%d/%Y").to_string(),
        date_long: now.format("%B %d, %Y").to_string(),
        day_of_week: now.format("%A").to_string(),
        timestamp: now.timestamp(),
    }
}

/// List available drives/disks
#[tauri::command]
fn list_drives() -> Vec<DriveInfo> {
    let sys = System::new_all();

    sysinfo::Disks::new_with_refreshed_list()
        .iter()
        .map(|disk| DriveInfo {
            name: disk.name().to_string_lossy().to_string(),
            mount_point: disk.mount_point().to_string_lossy().to_string(),
            total_space: disk.total_space(),
            available_space: disk.available_space(),
            is_removable: disk.is_removable(),
        })
        .collect()
}

/// Greet command for testing connectivity
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Kiosk.", name)
}

// ============================================================================
// TODO: Future Commands (Phase 2+)
// ============================================================================

// TODO: Add PTY terminal spawning
// #[tauri::command]
// fn spawn_terminal() -> Result<String, String> { ... }

// TODO: Add file operations
// #[tauri::command]
// fn read_directory(path: &str) -> Result<Vec<FileEntry>, String> { ... }

// TODO: Add USB device detection events
// #[tauri::command]
// fn watch_usb_devices() -> Result<(), String> { ... }

// TODO: Add Pi-specific commands (vcgencmd)
// #[tauri::command]
// fn get_gpu_temp() -> Result<f32, String> { ... }

// ============================================================================
// Application Entry Point
// ============================================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_system_stats,
            get_hardware_profile,
            get_datetime,
            list_drives,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
