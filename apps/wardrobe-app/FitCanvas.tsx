import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';
import { ClothingPiece, FitClothingPosition } from './types';
import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';

interface FitCanvasProps {
  clothing: ClothingPiece[];
  selectedClothing: ClothingPiece[];
  positions: FitClothingPosition[];
  onPositionsChange: (positions: FitClothingPosition[]) => void;
}

export interface FitCanvasRef {
  generateSnapshot: () => Promise<string>;
}

interface ClothingImageNode {
  id: string;
  image: HTMLImageElement | null;
  node: Konva.Image | null;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 400;

export const FitCanvas = forwardRef<FitCanvasRef, FitCanvasProps>(
  ({ clothing, selectedClothing, positions, onPositionsChange }, ref) => {
    const [images, setImages] = useState<Map<string, HTMLImageElement>>(new Map());
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const imageNodesRef = useRef<Map<string, Konva.Image>>(new Map());
    const transformerRef = useRef<Konva.Transformer>(null);
    const stageRef = useRef<Konva.Stage>(null);

  // Load images for selected clothing using asset protocol
  useEffect(() => {
    const loadImages = async () => {
      const newImages = new Map<string, HTMLImageElement>();

      for (const item of selectedClothing) {
        if (!images.has(item.id)) {
          try {
            const imagePath = await invoke<string>('get_image_path', { name: item.image });
            const assetUrl = convertFileSrc(imagePath);

            const img = new window.Image();
            img.src = assetUrl;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });

            newImages.set(item.id, img);
          } catch (e) {
            console.error(`Failed to load image for ${item.name}:`, e);
          }
        } else {
          newImages.set(item.id, images.get(item.id)!);
        }
      }

      setImages(newImages);
    };

    loadImages();
  }, [selectedClothing]);

  // Initialize positions for newly added clothing
  useEffect(() => {
    const existingIds = new Set(positions.map(p => p.clothingId));
    const newPositions = [...positions];

    selectedClothing.forEach((item, index) => {
      if (!existingIds.has(item.id)) {
        const img = images.get(item.id);
        const width = img ? Math.min(150, img.width) : 150;
        const height = img ? (width / (img.width || 1)) * (img.height || 1) : 150;

        newPositions.push({
          clothingId: item.id,
          x: 50 + (index * 20),
          y: 50 + (index * 20),
          width,
          height,
          rotation: 0,
        });
      }
    });

    // Remove positions for clothing that's no longer selected
    const selectedIds = new Set(selectedClothing.map(c => c.id));
    const filteredPositions = newPositions.filter(p => selectedIds.has(p.clothingId));

    if (filteredPositions.length !== positions.length) {
      onPositionsChange(filteredPositions);
    }
  }, [selectedClothing, images]);

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectedId) {
      const node = imageNodesRef.current.get(selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedId]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, clothingId: string) => {
    const newPositions = positions.map(p =>
      p.clothingId === clothingId
        ? { ...p, x: e.target.x(), y: e.target.y() }
        : p
    );
    onPositionsChange(newPositions);
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>, clothingId: string) => {
    const node = e.target as Konva.Image;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and apply to width/height
    node.scaleX(1);
    node.scaleY(1);

    const newPositions = positions.map(p =>
      p.clothingId === clothingId
        ? {
            ...p,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          }
        : p
    );
    onPositionsChange(newPositions);
  };

  const handleSelect = (clothingId: string) => {
    setSelectedId(clothingId === selectedId ? null : clothingId);
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Deselect when clicking on empty area
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
    }
  };

  // Expose method to generate snapshot
  useImperativeHandle(ref, () => ({
    generateSnapshot: async () => {
      if (!stageRef.current) {
        throw new Error('Stage not ready');
      }

      // Temporarily hide transformer for clean snapshot
      const transformer = transformerRef.current;
      const wasVisible = transformer?.visible();
      if (transformer) {
        transformer.visible(false);
      }

      try {
        // Generate high-quality thumbnail
        const dataURL = stageRef.current.toDataURL({
          pixelRatio: 2,
          mimeType: 'image/png',
          quality: 0.9,
          width: THUMBNAIL_WIDTH,
          height: THUMBNAIL_HEIGHT,
        });

        return dataURL;
      } finally {
        // Restore transformer visibility
        if (transformer && wasVisible) {
          transformer.visible(true);
        }
      }
    },
  }));

  return (
    <div className="bg-surface border-2 border-primary rounded-lg overflow-hidden">
      <Stage
        ref={stageRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleStageClick}
        className="bg-primary"
      >
        <Layer>
          {positions.map((pos) => {
            const img = images.get(pos.clothingId);
            if (!img) return null;

            return (
              <KonvaImage
                key={pos.clothingId}
                image={img}
                x={pos.x}
                y={pos.y}
                width={pos.width}
                height={pos.height}
                rotation={pos.rotation}
                draggable
                onClick={() => handleSelect(pos.clothingId)}
                onTap={() => handleSelect(pos.clothingId)}
                onDragEnd={(e) => handleDragEnd(e, pos.clothingId)}
                onTransformEnd={(e) => handleTransformEnd(e, pos.clothingId)}
                ref={(node) => {
                  if (node) {
                    imageNodesRef.current.set(pos.clothingId, node);
                  }
                }}
              />
            );
          })}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
});
