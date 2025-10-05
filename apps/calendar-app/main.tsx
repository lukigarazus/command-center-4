import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../shared/index.css';
import { AppProviders } from '../../shared/contexts/AppProviders';
import CalendarApp from './CalendarApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders appName="calendar-app">
      <CalendarApp />
    </AppProviders>
  </StrictMode>
);
