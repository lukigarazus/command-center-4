use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Coordinates {
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Deserialize)]
struct IpApiResponse {
    lat: f64,
    lon: f64,
}

/// Get approximate location based on IP address
/// Uses ip-api.com which doesn't require an API key
pub async fn get_location_from_ip() -> Result<Coordinates, String> {
    let url = "http://ip-api.com/json/?fields=lat,lon";

    let client = tauri_plugin_http::reqwest::Client::new();
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch location: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Location API error: {}", response.status()));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    let data: IpApiResponse = serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse location data: {}", e))?;

    Ok(Coordinates {
        latitude: data.lat,
        longitude: data.lon,
    })
}
