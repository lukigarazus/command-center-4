import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../shared/index.css';
import { AppProviders } from '../../shared/contexts/AppProviders';
import FriendsApp from './FriendsApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders appName="friends-app">
      <FriendsApp />
    </AppProviders>
  </StrictMode>
);
