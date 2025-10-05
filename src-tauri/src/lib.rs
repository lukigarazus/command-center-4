use specta::Type;
use serde::{Deserialize, Serialize};
use tauri_specta::{collect_commands, Builder};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = Builder::<tauri::Wry>::new()
        .commands(collect_commands![greet]);

    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default(),
            "../shared/types/bindings.ts",
        )
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            builder.mount_events(app);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
