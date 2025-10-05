import { ReactNode } from 'react';
import { StorageProvider } from './StorageContext';
import { EventProvider } from './EventContext';
import { ThemeProvider } from './ThemeContext';

interface AppProvidersProps {
  appName: string;
  children: ReactNode;
}

export const AppProviders = ({ appName, children }: AppProvidersProps) => {
  return (
    <StorageProvider appName={appName}>
      <EventProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </EventProvider>
    </StorageProvider>
  );
};
