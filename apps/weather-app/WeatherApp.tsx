import { useState, useEffect } from 'react';
import { useEvents, useEventListener } from '../../shared/contexts/EventContext';
import { useStorage } from '../../shared/contexts/StorageContext';
import { commands } from '../../shared/api';
import type { WeatherData } from '../../shared/types/bindings';

export default function WeatherApp() {
  const events = useEvents();
  const storage = useStorage();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const fetchWeatherForDate = async (date: string) => {
    if (lat === null || lon === null) {
      setError('Location not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await commands.fetchWeatherForDate(lat, lon, date);

      if (result.status === 'error') {
        throw new Error(result.error);
      }

      const data = result.data;
      setWeatherData(data);

      // Emit weather data changed event
      await events.emit('weather-data-changed', {
        temperature: data.temperature,
        feels_like: data.feels_like,
        humidity: data.humidity,
        description: data.description,
        icon: data.icon,
        location: data.location,
        date: data.date,
        timestamp: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  // Listen for calendar date selection events
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let hasInitialized = false;

    const setupListener = async () => {
      const storageKey = 'event:calendar-date-selected';
      const stored = await storage.getItem(storageKey);
      if (stored && !hasInitialized) {
        try {
          const payload = JSON.parse(stored);
          setSelectedDate(payload.date);
          if (lat !== null && lon !== null) {
            await fetchWeatherForDate(payload.date);
          }
        } catch (e) {
          console.error('Failed to parse stored event:', e);
        }
        hasInitialized = true;
      }

      const unlistenFn = await events.listen('calendar-date-selected', async (payload) => {
        setSelectedDate(payload.date);
        if (lat !== null && lon !== null) {
          await fetchWeatherForDate(payload.date);
        }
      });
      unlisten = unlistenFn;
    };

    if (lat !== null && lon !== null) {
      setupListener();
    }

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [lat, lon, events, storage]);

  // Get user's location from IP
  useEffect(() => {
    const getLocation = async () => {
      try {
        const result = await commands.getLocation();

        if (result.status === 'error') {
          throw new Error(result.error);
        }

        setLat(result.data.latitude);
        setLon(result.data.longitude);
        setGeoError(null);
      } catch (err) {
        setGeoError(`Failed to get location: ${err}`);
        // Fallback to London
        setLat(51.5074);
        setLon(-0.1278);
      }
    };

    getLocation();
  }, []);

  const fetchWeather = async () => {
    if (lat === null || lon === null) {
      setError('Location not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await commands.fetchWeather(lat, lon);

      if (result.status === 'error') {
        throw new Error(result.error);
      }

      const data = result.data;
      setWeatherData(data);

      // Emit weather data changed event
      await events.emit('weather-data-changed', {
        temperature: data.temperature,
        feels_like: data.feels_like,
        humidity: data.humidity,
        description: data.description,
        icon: data.icon,
        location: data.location,
        date: data.date,
        timestamp: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary p-4">
      <div className="max-w-2xl mx-auto">
        {/* Location Status */}
        {geoError && (
          <div className="bg-warning/20 border border-warning rounded-lg p-4 mb-4">
            <p className="text-warning text-sm">{geoError}</p>
            <p className="text-secondary text-xs mt-1">Using default location (London)</p>
          </div>
        )}

        {lat !== null && lon !== null && (
          <div className="bg-surface/50 backdrop-blur-sm rounded-lg p-3 mb-4 border border-primary">
            <p className="text-sm text-secondary">
              Location: {lat.toFixed(4)}°, {lon.toFixed(4)}°
            </p>
          </div>
        )}

        {selectedDate && (
          <div className="bg-accent/20 border border-accent rounded-lg p-4 mb-4">
            <p className="text-accent text-sm font-semibold">Forecast for:</p>
            <p className="text-primary text-lg">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-secondary text-xs mt-2">
              5-day forecast available. Select a date within the next 5 days.
            </p>
          </div>
        )}

        <div className="bg-surface rounded-lg shadow-xl p-6 border border-primary">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              <p className="mt-4 text-secondary">Loading weather data...</p>
            </div>
          )}

          {error && (
            <div className="bg-error/20 border border-error rounded-lg p-6">
              <h3 className="text-error font-semibold mb-2">Error</h3>
              <p className="text-error">{error}</p>
              <button
                onClick={fetchWeather}
                className="mt-4 px-4 py-2 bg-error text-white rounded hover:bg-error/90 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && weatherData && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-primary">
                    {weatherData.location}
                  </h2>
                  <p className="text-secondary capitalize mt-1">
                    {weatherData.description}
                  </p>
                </div>
                <img
                  src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
                  alt={weatherData.description}
                  className="w-20 h-20"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm text-secondary mb-1">Temperature</p>
                  <p className="text-3xl font-bold text-accent">
                    {Math.round(weatherData.temperature)}°C
                  </p>
                </div>
                <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm text-secondary mb-1">Feels Like</p>
                  <p className="text-3xl font-bold text-accent">
                    {Math.round(weatherData.feels_like)}°C
                  </p>
                </div>
                <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm text-secondary mb-1">Humidity</p>
                  <p className="text-3xl font-bold text-accent">
                    {weatherData.humidity}%
                  </p>
                </div>
              </div>

              <button
                onClick={fetchWeather}
                className="w-full px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-semibold"
              >
                Refresh Weather
              </button>
            </div>
          )}

          {!loading && !error && !weatherData && (
            <div className="text-center py-12">
              <p className="text-secondary mb-4">No weather data available</p>
              <button
                onClick={fetchWeather}
                className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 transition-colors"
              >
                Load Weather
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
