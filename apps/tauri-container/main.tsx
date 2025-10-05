import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../shared/index.css';
import { AppProviders } from '../../shared/contexts/AppProviders';
import TauriContainer from './TauriContainer';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders appName="tauri-container">
      <TauriContainer />
    </AppProviders>
  </StrictMode>
);
