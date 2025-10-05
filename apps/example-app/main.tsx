import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../shared/index.css';
import { EventProvider } from '../../shared/contexts/EventContext';
import ExampleApp from './ExampleApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EventProvider>
      <ExampleApp />
    </EventProvider>
  </StrictMode>
);
