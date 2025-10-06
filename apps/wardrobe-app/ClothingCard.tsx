import { useState, useEffect } from 'react';
import { ClothingPiece } from './types';
import { useImageService } from '../../shared/contexts/ImageContext';
import { convertFileSrc } from '@tauri-apps/api/core';

interface ClothingCardProps {
  clothing: ClothingPiece;
  onEdit: () => void;
  onDelete: () => void;
  onMarkWorn: () => void;
}

export const ClothingCard = ({ clothing, onEdit, onDelete, onMarkWorn }: ClothingCardProps) => {
  const imageService = useImageService();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const imagePath = await imageService.getImagePath(clothing.image);
        const assetUrl = convertFileSrc(imagePath);
        setImageUrl(assetUrl);
      } catch (e) {
        console.error('Failed to load image:', e);
      }
    };
    loadImage();
  }, [clothing.image, imageService]);

  const lastWorn = clothing.wornAt.length > 0
    ? new Date(clothing.wornAt[clothing.wornAt.length - 1])
    : null;

  const daysSinceWorn = lastWorn
    ? Math.floor((Date.now() - lastWorn.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="bg-surface rounded-lg shadow border border-primary hover:shadow-lg transition-shadow overflow-hidden">
      {/* Image */}
      <div className="aspect-square bg-primary/5 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={clothing.name} className="w-full h-full object-contain" />
        ) : (
          <div className="text-secondary">Loading...</div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-primary mb-2 truncate">{clothing.name}</h3>

        {/* Type */}
        <p className="text-sm text-secondary mb-2">
          Type: <span className="text-primary font-semibold">{clothing.type}</span>
        </p>

        {/* Weather */}
        <div className="flex flex-wrap gap-1 mb-3">
          {clothing.weather.map((w) => (
            <span
              key={w}
              className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full"
            >
              {w}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="mb-3 text-sm">
          <p className="text-secondary">
            Worn: <span className="text-primary font-semibold">{clothing.wornAt.length} times</span>
          </p>
          {daysSinceWorn !== null && (
            <p className="text-secondary">
              Last worn: <span className="text-primary font-semibold">{daysSinceWorn} days ago</span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onMarkWorn}
            className="flex-1 px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-semibold"
          >
            Mark Worn
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-2 bg-primary border border-primary text-primary rounded-lg hover:bg-surface-hover transition-colors text-sm"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-primary border border-primary text-error rounded-lg hover:bg-surface-hover transition-colors text-sm font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
