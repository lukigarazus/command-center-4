mod env;
mod weather;
mod weather_cache;
mod geolocation;

use specta::Type;
use serde::{Deserialize, Serialize};
use tauri_specta::{collect_commands, Builder};
use weather::WeatherData;
use geolocation::Coordinates;

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

    let builder = Builder::<tauri::Wry>::new()
        .commands(collect_commands![greet, fetch_weather, fetch_weather_for_date, get_location]);

    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default(),
            "../shared/types/bindings.ts",
        )
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            builder.mount_events(app);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
