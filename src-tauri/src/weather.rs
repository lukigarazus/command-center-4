use serde::{Deserialize, Serialize};
use specta::Type;
use crate::weather_cache::WeatherCache;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct WeatherData {
    pub temperature: f64,
    pub feels_like: f64,
    pub humidity: u32,
    pub description: String,
    pub icon: String,
    pub location: String,
    pub date: String, // ISO 8601 date string for the forecast
}

#[derive(Debug, Deserialize)]
struct OpenWeatherResponse {
    main: Main,
    weather: Vec<Weather>,
    name: String,
}

#[derive(Debug, Deserialize)]
struct Main {
    temp: f64,
    feels_like: f64,
    humidity: u32,
}

#[derive(Debug, Deserialize)]
struct Weather {
    description: String,
    icon: String,
}

pub async fn fetch_weather(lat: f64, lon: f64, api_key: &str) -> Result<WeatherData, String> {
    let cache = WeatherCache::global();

    // Check cache first
    if let Some(cached) = cache.get_current(lat, lon).await {
        return Ok(cached);
    }

    // Cache miss, fetch from API
    let url = format!(
        "https://api.openweathermap.org/data/2.5/weather?lat={}&lon={}&appid={}&units=metric",
        lat, lon, api_key
    );

    let client = tauri_plugin_http::reqwest::Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch weather: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Weather API error: {}", response.status()));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    let data: OpenWeatherResponse = serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse weather data: {}", e))?;

    let weather_data = WeatherData {
        temperature: data.main.temp,
        feels_like: data.main.feels_like,
        humidity: data.main.humidity,
        description: data.weather.first()
            .map(|w| w.description.clone())
            .unwrap_or_else(|| "Unknown".to_string()),
        icon: data.weather.first()
            .map(|w| w.icon.clone())
            .unwrap_or_else(|| "01d".to_string()),
        location: data.name,
        date: chrono::Utc::now().to_rfc3339(),
    };

    // Store in cache
    cache.set_current(lat, lon, weather_data.clone()).await;

    Ok(weather_data)
}

#[derive(Debug, Deserialize)]
struct ForecastResponse {
    list: Vec<ForecastItem>,
    city: City,
}

#[derive(Debug, Deserialize)]
struct ForecastItem {
    dt: i64,
    main: Main,
    weather: Vec<Weather>,
    dt_txt: String,
}

#[derive(Debug, Deserialize)]
struct City {
    name: String,
}

pub async fn fetch_forecast_for_date(
    lat: f64,
    lon: f64,
    date: &str,
    api_key: &str,
) -> Result<WeatherData, String> {
    let cache = WeatherCache::global();

    // Check cache first
    if let Some(cached) = cache.get_forecast(lat, lon, date).await {
        return Ok(cached);
    }

    // Cache miss, fetch from API
    // Parse the target date
    let target_date = chrono::DateTime::parse_from_rfc3339(date)
        .map_err(|e| format!("Invalid date format: {}", e))?;

    let target_timestamp = target_date.timestamp();
    let now = chrono::Utc::now();

    // Start of today (allows selecting today)
    let start_of_today = now.date_naive().and_hms_opt(0, 0, 0)
        .ok_or("Failed to create start of day")?
        .and_utc()
        .timestamp();

    // Check if the date is within the 5-day forecast range (from start of today)
    let five_days = 5 * 24 * 60 * 60;
    if target_timestamp < start_of_today || target_timestamp > now.timestamp() + five_days {
        return Err("Date must be today or within the next 5 days".to_string());
    }

    let url = format!(
        "https://api.openweathermap.org/data/2.5/forecast?lat={}&lon={}&appid={}&units=metric",
        lat, lon, api_key
    );

    let client = tauri_plugin_http::reqwest::Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch forecast: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Forecast API error: {}", response.status()));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    let data: ForecastResponse = serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse forecast data: {}", e))?;

    // Find the forecast closest to the target date
    let closest_forecast = data
        .list
        .iter()
        .min_by_key(|item| (item.dt - target_timestamp).abs())
        .ok_or("No forecast data available")?;

    let weather_data = WeatherData {
        temperature: closest_forecast.main.temp,
        feels_like: closest_forecast.main.feels_like,
        humidity: closest_forecast.main.humidity,
        description: closest_forecast.weather.first()
            .map(|w| w.description.clone())
            .unwrap_or_else(|| "Unknown".to_string()),
        icon: closest_forecast.weather.first()
            .map(|w| w.icon.clone())
            .unwrap_or_else(|| "01d".to_string()),
        location: data.city.name,
        date: closest_forecast.dt_txt.clone(),
    };

    // Store in cache
    cache.set_forecast(lat, lon, date, weather_data.clone()).await;

    Ok(weather_data)
}
