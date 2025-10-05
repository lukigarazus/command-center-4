import { ReactNode } from 'react';
import { StorageProvider } from './StorageContext';
import { EventProvider } from './EventContext';
import { ThemeProvider } from './ThemeContext';
import { ImageProvider } from './ImageContext';

interface AppProvidersProps {
  appName: string;
  children: ReactNode;
}

export const AppProviders = ({ appName, children }: AppProvidersProps) => {
  return (
    <StorageProvider appName={appName}>
      <EventProvider>
        <ThemeProvider>
          <ImageProvider>
            {children}
          </ImageProvider>
        </ThemeProvider>
      </EventProvider>
    </StorageProvider>
  );
};
