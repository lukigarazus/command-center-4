import { useState, useEffect, useRef } from 'react';
import { ClothingPiece, Fit, FitClothingPosition } from './types';
import { FitCanvas, FitCanvasRef } from './FitCanvas';
import { invoke } from '@tauri-apps/api/core';

interface FitFormProps {
  fit?: Fit;
  clothing: ClothingPiece[];
  onSave: (fit: Omit<Fit, 'id'> | Fit) => void;
  onCancel: () => void;
}

export function FitForm({ fit, clothing, onSave, onCancel }: FitFormProps) {
  const [name, setName] = useState(fit?.name || '');
  const [selectedClothingIds, setSelectedClothingIds] = useState<Set<string>>(
    new Set(fit?.clothingPositions.map(p => p.clothingId) || [])
  );
  const [positions, setPositions] = useState<FitClothingPosition[]>(
    fit?.clothingPositions || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<FitCanvasRef>(null);

  const selectedClothing = clothing.filter(c => selectedClothingIds.has(c.id));

  const toggleClothing = (clothingId: string) => {
    const newSelected = new Set(selectedClothingIds);
    if (newSelected.has(clothingId)) {
      newSelected.delete(clothingId);
    } else {
      newSelected.add(clothingId);
    }
    setSelectedClothingIds(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a name for the fit');
      return;
    }

    if (selectedClothingIds.size === 0) {
      alert('Please select at least one clothing item');
      return;
    }

    if (!canvasRef.current) {
      alert('Canvas not ready. Please try again.');
      return;
    }

    setIsSaving(true);

    try {
      // Generate snapshot from canvas
      const dataURL = await canvasRef.current.generateSnapshot();

      // Convert dataURL to bytes for image service
      const base64Data = dataURL.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Generate unique image name
      const imageId = fit?.id || Date.now().toString();
      const imageName = `fit-preview-${imageId}.png`;

      // Save image to image service
      await invoke('save_image', {
        name: imageName,
        data: Array.from(bytes),
      });

      const fitData: Omit<Fit, 'id'> | Fit = fit
        ? {
            ...fit,
            name: name.trim(),
            clothingPositions: positions,
            previewImage: imageName,
          }
        : {
            name: name.trim(),
            clothingPositions: positions,
            previewImage: imageName,
            wornAt: [],
            createdAt: new Date().toISOString(),
          };

      onSave(fitData);
    } catch (error) {
      console.error('Failed to save fit preview:', error);
      alert('Failed to save fit preview. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">
        {fit ? 'Edit Fit' : 'Create New Fit'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fit Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-primary mb-2">
            Fit Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-primary border border-primary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Enter fit name"
            required
          />
        </div>

        {/* Clothing Selection */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-2">
            Select Clothing Items
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-primary border border-primary rounded-lg">
            {clothing.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleClothing(item.id)}
                className={`p-2 rounded-lg border-2 transition-all ${
                  selectedClothingIds.has(item.id)
                    ? 'border-accent bg-accent/10'
                    : 'border-primary hover:border-secondary'
                }`}
              >
                <div className="text-sm font-medium text-primary truncate">
                  {item.name}
                </div>
                <div className="text-xs text-secondary capitalize">
                  {item.type}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas for arranging clothing */}
        {selectedClothing.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Arrange Clothing
            </label>
            <p className="text-xs text-secondary mb-2">
              Drag, resize, and rotate items on the canvas. Click an item to select it.
            </p>
            <div className="flex justify-center">
              <FitCanvas
                ref={canvasRef}
                clothing={clothing}
                selectedClothing={selectedClothing}
                positions={positions}
                onPositionsChange={setPositions}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-primary">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-primary rounded-lg text-primary hover:bg-primary/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : (fit ? 'Update Fit' : 'Create Fit')}
          </button>
        </div>
      </form>
    </div>
  );
}
