import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../shared/index.css';
import { EventProvider } from '../../shared/contexts/EventContext';
import CalendarApp from './CalendarApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EventProvider>
      <CalendarApp />
    </EventProvider>
  </StrictMode>
);
