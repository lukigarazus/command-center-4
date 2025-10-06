mod background_removal;
mod env;
mod geolocation;
mod image_service;
mod weather;
mod weather_cache;

use geolocation::Coordinates;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::Manager;
use tauri_specta::{collect_commands, Builder};
use weather::WeatherData;

// Example type-safe command
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GreetResponse {
    message: String,
}

#[tauri::command]
#[specta::specta]
fn greet(name: String) -> GreetResponse {
    GreetResponse {
        message: format!("Hello, {}! You've been greeted from Rust!", name),
    }
}

#[tauri::command]
#[specta::specta]
async fn fetch_weather(lat: f64, lon: f64) -> Result<WeatherData, String> {
    let api_key = &env::EnvConfig::get().open_weather_api_key;
    weather::fetch_weather(lat, lon, api_key).await
}

#[tauri::command]
#[specta::specta]
async fn fetch_weather_for_date(lat: f64, lon: f64, date: String) -> Result<WeatherData, String> {
    let api_key = &env::EnvConfig::get().open_weather_api_key;
    weather::fetch_forecast_for_date(lat, lon, &date, api_key).await
}

#[tauri::command]
#[specta::specta]
async fn get_location() -> Result<Coordinates, String> {
    geolocation::get_location_from_ip().await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize environment configuration
    env::EnvConfig::init().expect("Failed to load environment variables");

    let builder = Builder::<tauri::Wry>::new().commands(collect_commands![
        greet,
        fetch_weather,
        fetch_weather_for_date,
        get_location,
        image_service::save_image,
        image_service::get_image,
        image_service::get_image_path,
        image_service::remove_image,
        image_service::list_images,
        background_removal::remove_background
    ]);

    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default(),
            "../shared/types/bindings.ts",
        )
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            builder.mount_events(app);

            // Initialize RMBG model (optional - will fail gracefully if model not found)
            if let Ok(model_path) = app.path().resolve("model.onnx", tauri::path::BaseDirectory::Resource) {
                if model_path.exists() {
                    if let Err(e) = background_removal::init_rmbg(
                        model_path
                            .to_str()
                            .expect("Failed to convert model path to string"),
                    ) {
                        eprintln!("Warning: Failed to initialize RMBG model: {}", e);
                    }
                } else {
                    eprintln!("Warning: RMBG model not found at {:?}", model_path);
                }
            } else {
                eprintln!("Warning: Could not resolve RMBG model path");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
