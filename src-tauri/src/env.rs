use std::sync::OnceLock;

static ENV_CONFIG: OnceLock<EnvConfig> = OnceLock::new();

#[derive(Debug, Clone)]
pub struct EnvConfig {
    pub open_weather_api_key: String,
}

impl EnvConfig {
    fn load() -> Result<Self, String> {
        // Load .env file if it exists (for development)
        let _ = dotenvy::dotenv();

        let open_weather_api_key = std::env::var("OPEN_WEATHER_API_KEY")
            .map_err(|_| "OPEN_WEATHER_API_KEY environment variable not set".to_string())?;

        Ok(Self {
            open_weather_api_key,
        })
    }

    pub fn get() -> &'static EnvConfig {
        ENV_CONFIG.get().expect("EnvConfig not initialized")
    }

    pub fn init() -> Result<(), String> {
        let config = Self::load()?;
        ENV_CONFIG
            .set(config)
            .map_err(|_| "EnvConfig already initialized".to_string())
    }
}
