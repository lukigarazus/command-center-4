import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Store } from '@tauri-apps/plugin-store';
import { isTauri } from '@tauri-apps/api/core';

interface StorageInterface {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  listItems: () => Promise<Record<string, string>>;
}

const StorageContext = createContext<StorageInterface | null>(null);

// Detect if we're running in Tauri context
const isTauriContext = () => {
  return isTauri();
};

// Tauri store implementation
const createTauriStorage = (appName: string): StorageInterface => {
  let store: Store | null = null;

  const getStore = async () => {
    if (!store) {
      store = await Store.load(`${appName}.json`);
    }
    return store;
  };

  return {
    getItem: async (key: string) => {
      const s = await getStore();
      const value = await s.get<string>(key);
      return value ?? null;
    },
    setItem: async (key: string, value: string) => {
      const s = await getStore();
      await s.set(key, value);
      await s.save();
    },
    removeItem: async (key: string) => {
      const s = await getStore();
      await s.delete(key);
      await s.save();
    },
    listItems: async () => {
      const s = await getStore();
      const entries = await s.entries();
      const result: Record<string, string> = {};

      for (const [key, value] of entries) {
        // Store values are already strings in our interface
        result[key] = value as string;
      }

      return result;
    },
  };
};

// Web localStorage implementation with app-scoped keys
const createWebStorage = (appName: string): StorageInterface => ({
  getItem: async (key: string) => {
    return localStorage.getItem(`${appName}:${key}`);
  },
  setItem: async (key: string, value: string) => {
    localStorage.setItem(`${appName}:${key}`, value);
  },
  removeItem: async (key: string) => {
    localStorage.removeItem(`${appName}:${key}`);
  },
  listItems: async () => {
    const result: Record<string, string> = {};
    const prefix = `${appName}:`;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          // Remove the prefix from the key
          const unprefixedKey = key.substring(prefix.length);
          result[unprefixedKey] = value;
        }
      }
    }

    return result;
  },
});

interface StorageProviderProps {
  appName: string;
  children: ReactNode;
}

export const StorageProvider = ({ appName, children }: StorageProviderProps) => {
  const [storage] = useState<StorageInterface>(() =>
    isTauriContext() ? createTauriStorage(appName) : createWebStorage(appName)
  );

  return (
    <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>
  );
};

export const useStorage = (): StorageInterface => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within StorageProvider');
  }
  return context;
};
