import { useState, useEffect } from 'react';
import { useStorage } from '../../shared/contexts/StorageContext';
import { ClothingPiece, WeatherType, ClothingType, Fit } from './types';
import { ClothingCard } from './ClothingCard';
import { ClothingForm } from './ClothingForm';
import { FitCard } from './FitCard';
import { FitForm } from './FitForm';
import { invoke } from '@tauri-apps/api/core';

type ViewMode = 'clothing' | 'fits';

export default function WardrobeApp() {
  const storage = useStorage();
  const [viewMode, setViewMode] = useState<ViewMode>('clothing');
  const [clothing, setClothing] = useState<ClothingPiece[]>([]);
  const [fits, setFits] = useState<Fit[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClothing, setEditingClothing] = useState<ClothingPiece | null>(null);
  const [isFitFormOpen, setIsFitFormOpen] = useState(false);
  const [editingFit, setEditingFit] = useState<Fit | null>(null);
  const [filterWeather, setFilterWeather] = useState<WeatherType | null>(null);
  const [filterType, setFilterType] = useState<ClothingType | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'wornCount' | 'lastWorn'>('name');

  // Load clothing from storage
  useEffect(() => {
    const loadClothing = async () => {
      const stored = await storage.getItem('clothing');
      if (stored) {
        try {
          setClothing(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse clothing:', e);
        }
      }
    };
    loadClothing();
  }, [storage]);

  // Load fits from storage
  useEffect(() => {
    const loadFits = async () => {
      const stored = await storage.getItem('fits');
      if (stored) {
        try {
          setFits(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse fits:', e);
        }
      }
    };
    loadFits();
  }, [storage]);

  // Save clothing to storage
  const saveClothing = async (updatedClothing: ClothingPiece[]) => {
    setClothing(updatedClothing);
    await storage.setItem('clothing', JSON.stringify(updatedClothing));
  };

  // Save fits to storage
  const saveFits = async (updatedFits: Fit[]) => {
    setFits(updatedFits);
    await storage.setItem('fits', JSON.stringify(updatedFits));
  };

  const handleAddClothing = async (item: Omit<ClothingPiece, 'id'>) => {
    const newItem: ClothingPiece = {
      ...item,
      id: Date.now().toString(),
    };
    await saveClothing([...clothing, newItem]);
    setIsFormOpen(false);
  };

  const handleEditClothing = async (item: ClothingPiece) => {
    const updatedClothing = clothing.map((c) => (c.id === item.id ? item : c));
    await saveClothing(updatedClothing);
    setEditingClothing(null);
  };

  const handleDeleteClothing = async (id: string) => {
    const updatedClothing = clothing.filter((c) => c.id !== id);
    await saveClothing(updatedClothing);
  };

  const handleMarkWorn = async (id: string) => {
    const updatedClothing = clothing.map((c) =>
      c.id === id
        ? { ...c, wornAt: [...c.wornAt, new Date().toISOString()] }
        : c
    );
    await saveClothing(updatedClothing);
  };

  const openEditForm = (item: ClothingPiece) => {
    setEditingClothing(item);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingClothing(null);
  };

  // Fit handlers
  const handleAddFit = async (fit: Omit<Fit, 'id'>) => {
    const newFit: Fit = {
      ...fit,
      id: Date.now().toString(),
    };
    await saveFits([...fits, newFit]);
    setIsFitFormOpen(false);
  };

  const handleEditFit = async (fit: Fit) => {
    const updatedFits = fits.map((f) => (f.id === fit.id ? fit : f));
    await saveFits(updatedFits);
    setEditingFit(null);
  };

  const handleDeleteFit = async (id: string) => {
    const fit = fits.find(f => f.id === id);

    // Delete the fit's preview image if it exists
    if (fit?.previewImage) {
      try {
        await invoke('remove_image', { name: fit.previewImage });
      } catch (e) {
        console.error('Failed to delete fit preview image:', e);
      }
    }

    const updatedFits = fits.filter((f) => f.id !== id);
    await saveFits(updatedFits);
  };

  const handleMarkFitWorn = async (id: string) => {
    const fit = fits.find(f => f.id === id);
    if (!fit) return;

    const today = new Date().toISOString();

    // Update fit's wornAt
    const updatedFits = fits.map((f) =>
      f.id === id
        ? { ...f, wornAt: [...f.wornAt, today] }
        : f
    );

    // Update each clothing item's wornAt
    const updatedClothing = clothing.map((c) => {
      if (fit.clothingPositions.some(pos => pos.clothingId === c.id)) {
        return { ...c, wornAt: [...c.wornAt, today] };
      }
      return c;
    });

    await saveFits(updatedFits);
    await saveClothing(updatedClothing);
  };

  const openEditFitForm = (fit: Fit) => {
    setEditingFit(fit);
  };

  const closeFitForm = () => {
    setIsFitFormOpen(false);
    setEditingFit(null);
  };

  // Filter and sort clothing
  const filteredClothing = clothing
    .filter((item) => {
      if (filterWeather && !item.weather.includes(filterWeather)) return false;
      if (filterType && item.type !== filterType) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'wornCount') {
        return b.wornAt.length - a.wornAt.length;
      } else if (sortBy === 'lastWorn') {
        const aLast = a.wornAt.length > 0 ? new Date(a.wornAt[a.wornAt.length - 1]).getTime() : 0;
        const bLast = b.wornAt.length > 0 ? new Date(b.wornAt[b.wornAt.length - 1]).getTime() : 0;
        return bLast - aLast;
      }
      return 0;
    });

  const weatherOptions: WeatherType[] = ['hot', 'warm', 'cool', 'cold', 'rainy', 'snowy'];
  const clothingTypes: ClothingType[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'];

  return (
    <div className="min-h-screen bg-primary p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-primary">Wardrobe</h1>
          <div className="flex gap-3">
            <div className="flex bg-surface border border-primary rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('clothing')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  viewMode === 'clothing'
                    ? 'bg-accent text-white'
                    : 'text-primary hover:bg-primary/10'
                }`}
              >
                Clothing
              </button>
              <button
                onClick={() => setViewMode('fits')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  viewMode === 'fits'
                    ? 'bg-accent text-white'
                    : 'text-primary hover:bg-primary/10'
                }`}
              >
                Fits
              </button>
            </div>
            <button
              onClick={() => viewMode === 'clothing' ? setIsFormOpen(true) : setIsFitFormOpen(true)}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-semibold"
            >
              {viewMode === 'clothing' ? 'Add Clothing' : 'Create Fit'}
            </button>
          </div>
        </div>

        {/* Filters and Sort - Only show for clothing view */}
        {viewMode === 'clothing' && (
          <div className="bg-surface rounded-lg shadow p-4 mb-6 border border-primary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weather Filter */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">Filter by Weather</label>
              <select
                value={filterWeather || ''}
                onChange={(e) => setFilterWeather(e.target.value as WeatherType || null)}
                className="w-full px-4 py-2 bg-primary border border-primary rounded-lg text-primary"
              >
                <option value="">All</option>
                {weatherOptions.map((w) => (
                  <option key={w} value={w}>
                    {w.charAt(0).toUpperCase() + w.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">Filter by Type</label>
              <select
                value={filterType || ''}
                onChange={(e) => setFilterType(e.target.value as ClothingType || null)}
                className="w-full px-4 py-2 bg-primary border border-primary rounded-lg text-primary"
              >
                <option value="">All</option>
                {clothingTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full px-4 py-2 bg-primary border border-primary rounded-lg text-primary"
              >
                <option value="name">Name</option>
                <option value="wornCount">Most Worn</option>
                <option value="lastWorn">Recently Worn</option>
              </select>
            </div>
          </div>
          </div>
        )}

        {/* Clothing Grid */}
        {viewMode === 'clothing' && (
          filteredClothing.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary text-lg">
              {clothing.length === 0
                ? 'No clothing yet. Add your first piece!'
                : 'No clothing matches your filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredClothing.map((item) => (
              <ClothingCard
                key={item.id}
                clothing={item}
                onEdit={() => openEditForm(item)}
                onDelete={() => handleDeleteClothing(item.id)}
                onMarkWorn={() => handleMarkWorn(item.id)}
              />
            ))}
          </div>
          )
        )}

        {/* Fits Grid */}
        {viewMode === 'fits' && (
          fits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary text-lg">
                No fits yet. Create your first fit!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {fits.map((fit) => (
                <FitCard
                  key={fit.id}
                  fit={fit}
                  clothing={clothing}
                  onEdit={() => openEditFitForm(fit)}
                  onDelete={() => handleDeleteFit(fit.id)}
                  onMarkWorn={() => handleMarkFitWorn(fit.id)}
                />
              ))}
            </div>
          )
        )}

        {/* Add/Edit Clothing Form Modal */}
        {(isFormOpen || editingClothing) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-primary">
              <ClothingForm
                clothing={editingClothing || undefined}
                onSave={editingClothing ? handleEditClothing : handleAddClothing}
                onCancel={closeForm}
              />
            </div>
          </div>
        )}

        {/* Add/Edit Fit Form Modal */}
        {(isFitFormOpen || editingFit) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-primary">
              <FitForm
                fit={editingFit || undefined}
                clothing={clothing}
                onSave={editingFit ? handleEditFit : handleAddFit}
                onCancel={closeFitForm}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
