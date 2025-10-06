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
