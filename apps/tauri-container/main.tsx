import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../shared/index.css';
import { EventProvider } from '../../shared/contexts/EventContext';
import { ThemeProvider } from '../../shared/contexts/ThemeContext';
import TauriContainer from './TauriContainer';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EventProvider>
      <ThemeProvider>
        <TauriContainer />
      </ThemeProvider>
    </EventProvider>
  </StrictMode>
);
