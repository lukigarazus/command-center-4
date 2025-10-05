import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../shared/index.css';
import { AppProviders } from '../../shared/contexts/AppProviders';
import WeatherApp from './WeatherApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders appName="weather-app">
      <WeatherApp />
    </AppProviders>
  </StrictMode>
);
