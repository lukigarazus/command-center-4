use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ImageInfo {
    pub name: String,
    pub path: String,
}

fn get_images_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let media_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let images_dir = media_dir.join("images");

    // Create directory if it doesn't exist
    if !images_dir.exists() {
        fs::create_dir_all(&images_dir)
            .map_err(|e| format!("Failed to create images directory: {}", e))?;
    }

    Ok(images_dir)
}

#[tauri::command]
#[specta::specta]
pub async fn save_image(
    app: tauri::AppHandle,
    name: String,
    data: Vec<u8>,
) -> Result<String, String> {
    let images_dir = get_images_dir(&app)?;
    let file_path = images_dir.join(&name);

    fs::write(&file_path, data).map_err(|e| format!("Failed to write image: {}", e))?;

    file_path
        .to_str()
        .ok_or_else(|| "Invalid path".to_string())
        .map(|s| s.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_image(app: tauri::AppHandle, name: String) -> Result<Vec<u8>, String> {
    let images_dir = get_images_dir(&app)?;
    let file_path = images_dir.join(&name);

    if !file_path.exists() {
        return Err(format!("Image '{}' not found", name));
    }

    fs::read(&file_path).map_err(|e| format!("Failed to read image: {}", e))
}

#[tauri::command]
#[specta::specta]
pub async fn remove_image(app: tauri::AppHandle, name: String) -> Result<(), String> {
    let images_dir = get_images_dir(&app)?;
    let file_path = images_dir.join(&name);

    if !file_path.exists() {
        return Err(format!("Image '{}' not found", name));
    }

    fs::remove_file(&file_path).map_err(|e| format!("Failed to remove image: {}", e))
}

#[tauri::command]
#[specta::specta]
pub async fn list_images(app: tauri::AppHandle) -> Result<Vec<ImageInfo>, String> {
    let images_dir = get_images_dir(&app)?;

    if !images_dir.exists() {
        return Ok(vec![]);
    }

    let entries = fs::read_dir(&images_dir)
        .map_err(|e| format!("Failed to read images directory: {}", e))?;

    let mut images = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_file() {
            if let (Some(name), Some(path_str)) = (
                path.file_name().and_then(|n| n.to_str()),
                path.to_str(),
            ) {
                images.push(ImageInfo {
                    name: name.to_string(),
                    path: path_str.to_string(),
                });
            }
        }
    }

    Ok(images)
}
