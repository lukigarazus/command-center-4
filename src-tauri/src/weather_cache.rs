use std::sync::OnceLock;
use std::time::Duration;
use moka::future::Cache;
use crate::weather::WeatherData;

static WEATHER_CACHE: OnceLock<WeatherCache> = OnceLock::new();

pub struct WeatherCache {
    current_cache: Cache<String, WeatherData>,
    forecast_cache: Cache<String, WeatherData>,
}

impl WeatherCache {
    fn new() -> Self {
        Self {
            // Cache current weather for 10 minutes
            current_cache: Cache::builder()
                .time_to_live(Duration::from_secs(10 * 60))
                .max_capacity(100)
                .build(),
            // Cache forecast for 1 hour
            forecast_cache: Cache::builder()
                .time_to_live(Duration::from_secs(60 * 60))
                .max_capacity(1000)
                .build(),
        }
    }

    pub fn global() -> &'static WeatherCache {
        WEATHER_CACHE.get_or_init(Self::new)
    }

    pub async fn get_current(&self, lat: f64, lon: f64) -> Option<WeatherData> {
        let key = format!("current_{:.4}_{:.4}", lat, lon);
        self.current_cache.get(&key).await
    }

    pub async fn set_current(&self, lat: f64, lon: f64, data: WeatherData) {
        let key = format!("current_{:.4}_{:.4}", lat, lon);
        self.current_cache.insert(key, data).await;
    }

    pub async fn get_forecast(&self, lat: f64, lon: f64, date: &str) -> Option<WeatherData> {
        let key = format!("forecast_{:.4}_{:.4}_{}", lat, lon, date);
        self.forecast_cache.get(&key).await
    }

    pub async fn set_forecast(&self, lat: f64, lon: f64, date: &str, data: WeatherData) {
        let key = format!("forecast_{:.4}_{:.4}_{}", lat, lon, date);
        self.forecast_cache.insert(key, data).await;
    }
}
