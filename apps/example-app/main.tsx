import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../shared/index.css';
import { AppProviders } from '../../shared/contexts/AppProviders';
import ExampleApp from './ExampleApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders appName="example-app">
      <ExampleApp />
    </AppProviders>
  </StrictMode>
);
