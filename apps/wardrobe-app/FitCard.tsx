import { useState, useEffect } from 'react';
import { Fit, ClothingPiece } from './types';
import { invoke } from '@tauri-apps/api/core';

interface FitCardProps {
  fit: Fit;
  clothing: ClothingPiece[];
  onEdit: () => void;
  onDelete: () => void;
  onMarkWorn: () => void;
}

export function FitCard({ fit, clothing, onEdit, onDelete, onMarkWorn }: FitCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const fitClothing = fit.clothingPositions
    .map(pos => clothing.find(c => c.id === pos.clothingId))
    .filter((c): c is ClothingPiece => c !== undefined);

  const lastWorn = fit.wornAt.length > 0
    ? new Date(fit.wornAt[fit.wornAt.length - 1]).toLocaleDateString()
    : 'Never';

  // Load preview image
  useEffect(() => {
    const loadPreview = async () => {
      try {
        const imageData = await invoke<number[]>('get_image', { name: fit.previewImage });
        const blob = new Blob([new Uint8Array(imageData)], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (e) {
        console.error(`Failed to load fit preview for ${fit.name}:`, e);
        setImageError(true);
      }
    };

    loadPreview();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [fit.previewImage]);

  return (
    <div className="bg-surface border border-primary rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* Preview Image */}
      <div className="relative bg-primary aspect-[3/4] overflow-hidden">
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center text-secondary text-sm">
            <div className="text-center p-4">
              <div className="text-4xl mb-2">👔</div>
              <div>Preview not available</div>
            </div>
          </div>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt={fit.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-secondary">
            <div className="text-sm">Loading...</div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="p-4 border-b border-primary">
        <h3 className="text-lg font-bold text-primary mb-1">{fit.name}</h3>
        <div className="text-sm text-secondary">
          {fitClothing.length} item{fitClothing.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Clothing List */}
      <div className="p-4 space-y-2">
        <div className="text-xs font-semibold text-secondary uppercase mb-2">
          Items in this fit:
        </div>
        <div className="flex flex-wrap gap-1">
          {fitClothing.map(item => (
            <span
              key={item.id}
              className="px-2 py-1 bg-primary border border-primary rounded text-xs text-primary"
            >
              {item.name}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4 space-y-1 text-sm">
        <div className="flex justify-between text-secondary">
          <span>Worn:</span>
          <span className="font-semibold">{fit.wornAt.length} times</span>
        </div>
        <div className="flex justify-between text-secondary">
          <span>Last worn:</span>
          <span className="font-semibold">{lastWorn}</span>
        </div>
        <div className="flex justify-between text-secondary">
          <span>Created:</span>
          <span className="font-semibold">
            {new Date(fit.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex gap-2">
        <button
          onClick={onMarkWorn}
          className="flex-1 px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-semibold"
        >
          Wear Today
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-2 border border-primary rounded-lg text-primary hover:bg-primary/10 transition-colors text-sm"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
