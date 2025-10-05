import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../shared/index.css';
import { EventProvider } from '../../shared/contexts/EventContext';
import { ThemeProvider } from '../../shared/contexts/ThemeContext';
import WeatherApp from './WeatherApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EventProvider>
      <ThemeProvider>
        <WeatherApp />
      </ThemeProvider>
    </EventProvider>
  </StrictMode>
);
