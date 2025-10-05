import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../shared/index.css';
import { EventProvider } from '../../shared/contexts/EventContext';
import TauriContainer from './TauriContainer';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EventProvider>
      <TauriContainer />
    </EventProvider>
  </StrictMode>
);
