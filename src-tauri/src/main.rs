// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::GlobalShortcutManager;
use tauri::Manager;
use tauri::SystemTray;
use tauri::{CustomMenuItem, SystemTrayMenu, SystemTrayMenuItem};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn toggle_window(window: tauri::Window) {
    if window
        .is_visible()
        .expect("failed to check if the window is visible")
    {
        window.hide().expect("failed to hide the window");
    } else {
        window.show().expect("failed to show the window");
    }
}

#[tauri::command]
fn quit_application(window: tauri::Window) {
    window.close().expect("failed to close the window");
    std::process::exit(0);
}

fn main() {
    let toggle: CustomMenuItem =
        CustomMenuItem::new("toggle_window".to_string(), "Show/Hide Window");
    let quit: CustomMenuItem = CustomMenuItem::new("quit_application".to_string(), "Quit");
    let tray_menu: SystemTrayMenu = SystemTrayMenu::new()
        .add_item(toggle)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    tauri::Builder::default()
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
                tauri::SystemTrayEvent::LeftClick { .. } => {
                    let window: tauri::Window = app.get_window("main").unwrap();
                    toggle_window(window);
                }
                tauri::SystemTrayEvent::MenuItemClick { id, .. } => {
                    let window: tauri::Window = app.get_window("main").unwrap();
                    match id.as_str() {
                        "toggle_window" => toggle_window(window),
                        "quit_application" => quit_application(window),
                        _ => {}
                    }
                }
                _ => {}
            },
        )
        .invoke_handler(tauri::generate_handler![toggle_window, quit_application])
        .setup(|app: &mut tauri::App| {
            let window = app.get_window("main").unwrap();

            app.global_shortcut_manager()
                .register("Alt+A", move || toggle_window(window.clone()))
                .expect("failed to register shortcut");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
