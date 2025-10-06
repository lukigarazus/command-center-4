import { useState, useRef } from "react";
import { ClothingPiece, WeatherType, ClothingType } from "./types";
import { useImageService } from "../../shared/contexts/ImageContext";
import { commands } from "../../shared/api";

interface ClothingFormProps {
  clothing?: ClothingPiece;
  onSave: (clothing: ClothingPiece | Omit<ClothingPiece, "id">) => void;
  onCancel: () => void;
}

const weatherOptions: WeatherType[] = [
  "hot",
  "warm",
  "cool",
  "cold",
  "rainy",
  "snowy",
];
const clothingTypes: ClothingType[] = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "shoes",
  "accessory",
];

export const ClothingForm = ({
  clothing,
  onSave,
  onCancel,
}: ClothingFormProps) => {
  const imageService = useImageService();
  const [name, setName] = useState(clothing?.name || "");
  const [weather, setWeather] = useState<WeatherType[]>(
    clothing?.weather || []
  );
  const [type, setType] = useState<ClothingType>(clothing?.type || "top");
  const [image, setImage] = useState(clothing?.image || "");
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      const imageData = Array.from(new Uint8Array(arrayBuffer));

      // Remove background using Rust backend
      const result = await commands.removeBackground(imageData);
      if (result.status === 'error') {
        throw new Error(result.error);
      }

      const processedData = new Uint8Array(result.data);

      // Save to image service
      const imageName = `clothing-${Date.now()}-${file.name.replace(
        /\.[^/.]+$/,
        ""
      )}.png`;
      await imageService.saveImage(imageName, processedData);
      setImage(imageName);
    } catch (err) {
      console.error("Failed to process image:", err);
      alert("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleWeather = (w: WeatherType) => {
    setWeather((prev) =>
      prev.includes(w) ? prev.filter((item) => item !== w) : [...prev, w]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      alert("Please upload an image");
      return;
    }

    const clothingData: ClothingPiece | Omit<ClothingPiece, "id"> = {
      ...(clothing?.id && { id: clothing.id }),
      name,
      weather,
      type,
      image,
      wornAt: clothing?.wornAt || [],
    };

    onSave(clothingData as any);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">
        {clothing ? "Edit Clothing" : "Add Clothing"}
      </h2>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-primary mb-2">
          Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 bg-primary border border-primary rounded-lg text-primary"
        />
      </div>

      {/* Type */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-primary mb-2">
          Type *
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ClothingType)}
          className="w-full px-4 py-2 bg-primary border border-primary rounded-lg text-primary"
        >
          {clothingTypes.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Weather */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-primary mb-2">
          Weather *
        </label>
        <div className="flex flex-wrap gap-2">
          {weatherOptions.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => toggleWeather(w)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                weather.includes(w)
                  ? "bg-accent text-white"
                  : "bg-primary text-secondary border border-primary hover:bg-surface-hover"
              }`}
            >
              {w.charAt(0).toUpperCase() + w.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Image */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-primary mb-2">
          Image *
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isProcessing}
          className="w-full px-4 py-2 bg-primary border border-primary rounded-lg text-primary disabled:opacity-50"
        />
        {isProcessing && (
          <div className="mt-2">
            <p className="text-sm text-secondary mt-1">
              Removing background...
            </p>
          </div>
        )}
        {image && !isProcessing && (
          <p className="text-sm text-success mt-2">
            ✓ Image uploaded successfully
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="px-6 py-2 bg-primary border border-primary text-primary rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isProcessing}
          className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-semibold disabled:opacity-50"
        >
          {clothing ? "Save Changes" : "Add Clothing"}
        </button>
      </div>
    </form>
  );
};
