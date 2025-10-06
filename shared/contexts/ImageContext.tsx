import { createContext, useContext, ReactNode, useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { commands } from '../api';
import type { ImageInfo } from '../types/bindings';

interface ImageServiceInterface {
  saveImage: (name: string, data: Uint8Array) => Promise<string>;
  getImage: (name: string) => Promise<Uint8Array>;
  getImagePath: (name: string) => Promise<string>;
  removeImage: (name: string) => Promise<void>;
  listImages: () => Promise<ImageInfo[]>;
}

const ImageContext = createContext<ImageServiceInterface | null>(null);

// Detect if we're running in Tauri context
const isTauriContext = () => {
  return isTauri();
};

// Tauri image service implementation
const createTauriImageService = (): ImageServiceInterface => ({
  saveImage: async (name: string, data: Uint8Array) => {
    const result = await commands.saveImage(name, Array.from(data));
    if (result.status === 'error') {
      throw new Error(result.error);
    }
    return result.data;
  },
  getImage: async (name: string) => {
    const result = await commands.getImage(name);
    if (result.status === 'error') {
      throw new Error(result.error);
    }
    return new Uint8Array(result.data);
  },
  getImagePath: async (name: string) => {
    const result = await commands.getImagePath(name);
    if (result.status === 'error') {
      throw new Error(result.error);
    }
    return result.data;
  },
  removeImage: async (name: string) => {
    const result = await commands.removeImage(name);
    if (result.status === 'error') {
      throw new Error(result.error);
    }
  },
  listImages: async () => {
    const result = await commands.listImages();
    if (result.status === 'error') {
      throw new Error(result.error);
    }
    return result.data;
  },
});

// Web stub implementation
const createWebImageService = (): ImageServiceInterface => ({
  saveImage: async (name: string, data: Uint8Array) => {
    console.log('[WebImageService] saveImage not implemented:', name);
    return '';
  },
  getImage: async (name: string) => {
    console.log('[WebImageService] getImage not implemented:', name);
    return new Uint8Array();
  },
  getImagePath: async (name: string) => {
    console.log('[WebImageService] getImagePath not implemented:', name);
    return '';
  },
  removeImage: async (name: string) => {
    console.log('[WebImageService] removeImage not implemented:', name);
  },
  listImages: async () => {
    console.log('[WebImageService] listImages not implemented');
    return [];
  },
});

interface ImageProviderProps {
  children: ReactNode;
}

export const ImageProvider = ({ children }: ImageProviderProps) => {
  const [imageService] = useState<ImageServiceInterface>(() =>
    isTauriContext() ? createTauriImageService() : createWebImageService()
  );

  return (
    <ImageContext.Provider value={imageService}>
      {children}
    </ImageContext.Provider>
  );
};

export const useImageService = (): ImageServiceInterface => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageService must be used within ImageProvider');
  }
  return context;
};
