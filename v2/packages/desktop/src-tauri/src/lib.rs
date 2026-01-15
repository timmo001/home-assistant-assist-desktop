use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
struct BackendReadyData {
    url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    password: Option<String>,
}

/// Tauri command to ensure backend is ready
/// 
/// TODO: This is a stub implementation. In the future, this will:
/// - Spawn the Python backend as a sidecar process
/// - Wait for the backend to be ready
/// - Return the backend URL and password
#[tauri::command]
async fn ensure_backend_ready() -> Result<BackendReadyData, String> {
    println!("ensure_backend_ready called (stub implementation)");
    
    // For now, return a fake backend URL
    // TODO: Implement actual backend spawning and health checking
    Ok(BackendReadyData {
        url: "http://localhost:8000".to_string(),
        password: Some("fake-password-123".to_string()),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![ensure_backend_ready])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
