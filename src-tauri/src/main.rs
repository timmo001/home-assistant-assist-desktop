// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs::File;
use tauri::GlobalShortcutManager;
use tauri::Manager;
use tauri::SystemTray;
use tauri::{CustomMenuItem, SystemTrayMenu, SystemTrayMenuItem};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_log::LogTarget;
use url::Url;

// Define settings
#[derive(Serialize, Deserialize)]
struct HomeAssistantSettings {
    access_token: String,
    host: String,
    port: u16,
    ssl: bool,
}

#[derive(Serialize, Deserialize)]
struct Settings {
    autostart: bool,
    home_assistant: HomeAssistantSettings,
}

#[derive(Debug, Serialize)]
struct CommandError {
    message: String,
}

impl From<serde_json::Error> for CommandError {
    fn from(error: serde_json::Error) -> Self {
        CommandError {
            message: error.to_string(),
        }
    }
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn open_app(window: tauri::Window) {
    println!("Opening app...");

    let current_url: String = window.url().to_string();
    let mut url = Url::parse(&current_url).expect("failed to parse URL");

    window.show().expect("failed to show the window");
    window.set_focus().expect("failed to focus the window");

    url.set_path("/");
    println!("Navigating to {}", url);

    window
        .eval(&format!("window.location.href = '{}';", url))
        .unwrap();
}

#[tauri::command]
fn open_settings(window: tauri::Window) {
    println!("Opening settings...");

    let current_url: String = window.url().to_string();
    let mut url = Url::parse(&current_url).expect("failed to parse URL");

    window.show().expect("failed to show the window");
    window.set_focus().expect("failed to focus the window");

    url.set_path("/settings");
    println!("Navigating to {}", url);

    window
        .eval(&format!("window.location.href = '{}';", url))
        .unwrap();
}

#[tauri::command]
fn load_settings(app_handle: tauri::AppHandle) -> Result<Settings, CommandError> {
    let settings_path: String = app_handle
        .path_resolver()
        .app_config_dir()
        .unwrap()
        .join("settings.json")
        .to_str()
        .unwrap()
        .to_string();

    println!("Loading settings from {}...", settings_path);

    // If the directory doesn't exist, create it.
    if !std::path::Path::new(&settings_path)
        .parent()
        .unwrap()
        .exists()
    {
        std::fs::create_dir_all(std::path::Path::new(&settings_path).parent().unwrap()).unwrap();
    }

    // Convert the settings path to a Path.
    let path: &std::path::Path = std::path::Path::new(&settings_path);

    // Check if the file exists.
    if !path.exists() {
        // Create the file if it doesn't exist.
        let file: File = File::create(path).unwrap();
        // Create a new Settings struct.
        let settings: Settings = Settings {
            autostart: false,
            home_assistant: HomeAssistantSettings {
                access_token: "".to_string(),
                host: "homeassistant.local".to_string(),
                port: 8123,
                ssl: false,
            },
        };
        // Serialize the Settings struct into JSON.
        serde_json::to_writer_pretty(file, &settings).unwrap();
    }
    // Open the file in read-only mode.
    let file: File = File::open(path).unwrap();
    // Read the JSON contents of the file as an instance of `Settings`.
    let settings: Settings = serde_json::from_reader(file)?;

    Ok(settings)
}

#[tauri::command]
fn update_settings(app_handle: tauri::AppHandle, settings: Settings) -> Result<(), CommandError> {
    let settings_path: String = app_handle
        .path_resolver()
        .app_config_dir()
        .unwrap()
        .join("settings.json")
        .to_str()
        .unwrap()
        .to_string();

    println!("Updating settings at {}...", settings_path);

    // Open the file in write-only mode.
    let file: File = File::create(settings_path).unwrap();
    // Serialize the Settings struct into JSON.
    serde_json::to_writer_pretty(file, &settings).unwrap();

    Ok(())
}

#[tauri::command]
fn toggle_window(window: tauri::Window) {
    if window
        .is_visible()
        .expect("failed to check if the window is visible")
    {
        window.hide().expect("failed to hide the window");
    } else {
        let url = window.url().to_string();
        if url.contains("settings") {
            open_app(window);
            return;
        }
        window.show().expect("failed to show the window");
        window.set_focus().expect("failed to focus the window");
        window
            .emit("focus", {})
            .expect("failed to emit focus event");
    }
}

#[tauri::command]
fn trigger_voice_pipeline(window: tauri::Window) {
    if !window
        .is_visible()
        .expect("failed to check if the window is visible")
    {
        window.show().expect("failed to show the window");
        window.set_focus().expect("failed to focus the window");
        window
            .emit("focus", {})
            .expect("failed to emit focus event");
    }

    window
        .emit("trigger-voice-pipeline", {})
        .expect("failed to emit trigger-voice-pipeline event");
}

#[tauri::command]
fn hide_window(window: tauri::Window) {
    window.hide().expect("failed to hide the window");
}

#[tauri::command]
fn open_logs_directory(app_handle: tauri::AppHandle) {
    let path: String = app_handle
        .path_resolver()
        .app_log_dir()
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();

    println!("Opening logs directory at {}...", path);

    // Open file with default application
    opener::open(path).unwrap();
}

#[tauri::command]
fn quit_application(window: tauri::Window) {
    window.close().expect("failed to close the window");
    std::process::exit(0);
}

fn main() {
    let tray_menu: SystemTrayMenu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new(
            "toggle_window".to_string(),
            "Show/Hide Window (Alt+A)",
        ))
        .add_item(CustomMenuItem::new(
            "trigger_voice_pipeline".to_string(),
            "Trigger Voice Pipeline (Alt+Shift+A)",
        ))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("open_settings".to_string(), "Settings"))
        .add_item(CustomMenuItem::new("open_logs_directory".to_string(), "Open Logs"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit_application".to_string(), "Quit"));

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([LogTarget::LogDir, LogTarget::Stdout, LogTarget::Webview])
                .build(),
        )
        .on_window_event(|event: tauri::GlobalWindowEvent| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .on_system_tray_event(
            |app: &tauri::AppHandle, event: tauri::SystemTrayEvent| match event {
                tauri::SystemTrayEvent::MenuItemClick { id, .. } => {
                    let window: tauri::Window = app.get_window("main").unwrap();
                    match id.as_str() {
                        "toggle_window" => toggle_window(window),
                        "trigger_voice_pipeline" => trigger_voice_pipeline(window),
                        "open_settings" => open_settings(window),
                        "open_logs_directory" => open_logs_directory(app.clone()),
                        "quit_application" => quit_application(window),
                        _ => {}
                    }
                }
                _ => {}
            },
        )
        .invoke_handler(tauri::generate_handler![
            open_app,
            open_settings,
            load_settings,
            update_settings,
            toggle_window,
            trigger_voice_pipeline,
            hide_window,
            open_logs_directory,
            quit_application
        ])
        .setup(|app: &mut tauri::App| {
            let window = app.get_window("main").unwrap();
            app.global_shortcut_manager()
                .register("Alt+A", move || {
                    toggle_window(window.clone());
                })
                .expect("failed to register Alt+A shortcut");

            let window = app.get_window("main").unwrap();
            app.global_shortcut_manager()
                .register("Alt+Shift+A", move || {
                    trigger_voice_pipeline(window.clone());
                })
                .expect("failed to register Alt+Shift+A shortcut");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
