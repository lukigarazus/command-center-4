import { useState, useEffect } from 'react';
import { useEvents, useEventListener } from '../../shared/contexts/EventContext';
import { commands } from '../../shared/api';
import type { WeatherData } from '../../shared/types/bindings';

export default function WeatherApp() {
  const events = useEvents();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Listen for calendar date selection events
  useEventListener('calendar-date-selected', async (payload) => {
    setSelectedDate(payload.date);
    if (lat !== null && lon !== null) {
      await fetchWeatherForDate(payload.date);
    }
  });

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

  // Fetch weather when coordinates are available
  useEffect(() => {
    if (lat !== null && lon !== null) {
      fetchWeather();
    }
  }, [lat, lon]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-6">Weather</h1>

        {/* Location Status */}
        {geoError && (
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">{geoError}</p>
            <p className="text-yellow-700 text-xs mt-1">Using default location (London)</p>
          </div>
        )}

        {lat !== null && lon !== null && (
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6 text-white">
            <p className="text-sm">
              Location: {lat.toFixed(4)}°, {lon.toFixed(4)}°
            </p>
          </div>
        )}

        {selectedDate && (
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm font-semibold">Forecast for:</p>
            <p className="text-blue-900 text-lg">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-blue-700 text-xs mt-2">
              5-day forecast available. Select a date within the next 5 days.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-xl p-8">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Loading weather data...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-red-800 font-semibold mb-2">Error</h3>
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchWeather}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && weatherData && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {weatherData.location}
                  </h2>
                  <p className="text-gray-600 capitalize mt-1">
                    {weatherData.description}
                  </p>
                </div>
                <img
                  src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
                  alt={weatherData.description}
                  className="w-20 h-20"
                />
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Temperature</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {Math.round(weatherData.temperature)}°C
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Feels Like</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {Math.round(weatherData.feels_like)}°C
                  </p>
                </div>
                <div className="text-center p-4 bg-cyan-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Humidity</p>
                  <p className="text-3xl font-bold text-cyan-600">
                    {weatherData.humidity}%
                  </p>
                </div>
              </div>

              <button
                onClick={fetchWeather}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
              >
                Refresh Weather
              </button>
            </div>
          )}

          {!loading && !error && !weatherData && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No weather data available</p>
              <button
                onClick={fetchWeather}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
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
