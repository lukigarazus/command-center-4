import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../shared/index.css';
import { AppProviders } from '../../shared/contexts/AppProviders';
import WardrobeApp from './WardrobeApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders appName="wardrobe-app">
      <WardrobeApp />
    </AppProviders>
  </StrictMode>
);
