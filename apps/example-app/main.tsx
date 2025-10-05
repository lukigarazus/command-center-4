import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../shared/index.css';
import { EventProvider } from '../../shared/contexts/EventContext';
import { ThemeProvider } from '../../shared/contexts/ThemeContext';
import ExampleApp from './ExampleApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EventProvider>
      <ThemeProvider>
        <ExampleApp />
      </ThemeProvider>
    </EventProvider>
  </StrictMode>
);
