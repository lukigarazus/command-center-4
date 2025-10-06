export type WeatherType = 'hot' | 'warm' | 'cool' | 'cold' | 'rainy' | 'snowy';
export type ClothingType = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory';

export interface ClothingPiece {
  id: string;
  name: string;
  weather: WeatherType[];
  image: string; // Image name in image service
  wornAt: string[]; // Array of ISO 8601 date strings
  type: ClothingType;
}

export interface FitClothingPosition {
  clothingId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface Fit {
  id: string;
  name: string;
  clothingPositions: FitClothingPosition[];
  previewImage: string; // Image name in image service
  wornAt: string[]; // Array of ISO 8601 date strings when the fit was worn
  createdAt: string;
}
