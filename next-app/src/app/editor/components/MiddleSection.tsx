'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface PlacedImage {
  id: string;
  file: File;
  url: string;
  cropData: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  section: 'front' | 'back' | 'leftSleeve' | 'rightSleeve';
}

interface MiddleSectionProps {
  className?: string;
  placedImages: PlacedImage[];
  selectedImage: string | null;
  onSelectImage: (id: string | null) => void;
  onImageTransform: (imageId: string, transforms: Partial<PlacedImage>) => void;
  onRemoveImage: (imageId: string) => void;
  cropImage: File | null;
  cropData: { x: number; y: number; width: number; height: number };
  onCropAreaChange: (cropData: { x: number; y: number; width: number; height: number }) => void;
  modelAngle: 'front' | 'back' | 'left' | 'right';
  onModelAngleChange: (angle: 'front' | 'back' | 'left' | 'right') => void;
}

interface TShirtSectionProps {
  title: string;
  section: 'front' | 'back' | 'leftSleeve' | 'rightSleeve';
  placedImages: PlacedImage[];
  selectedImage: string | null;
  onSelectImage: (id: string | null) => void;
  onImageTransform: (imageId: string, transforms: Partial<PlacedImage>) => void;
  onRemoveImage: (imageId: string) => void;
}

function TShirtSection({
  title,
  section,
  placedImages,
  selectedImage,
  onSelectImage,
  onImageTransform,
  onRemoveImage,
}: TShirtSectionProps) {
  const sectionImage = placedImages.find(img => img.section === section);

  const handleImageClick = () => {
    if (sectionImage) {
      onSelectImage(selectedImage === sectionImage.id ? null : sectionImage.id);
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden h-full">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-800 text-center">{title}</h3>
      </div>

      {/* Content */}
      <div className="relative h-full bg-gray-100">
        {sectionImage ? (
          <div className="relative w-full h-full">
            <img
              src={sectionImage.url}
              alt={`${title} design`}
              className="w-full h-full object-contain cursor-pointer"
              onClick={handleImageClick}
              style={{
                transform: `translate(${sectionImage.position.x}px, ${sectionImage.position.y}px) scale(${sectionImage.scale}) rotate(${sectionImage.rotation}deg)`,
              }}
              draggable={false}
            />

            {/* Selection indicator */}
            {selectedImage === sectionImage.id && (
              <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none">
                <div className="absolute top-2 right-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(sectionImage.id);
                    }}
                    className="w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <span className="text-3xl mb-2 block">👕</span>
              <p className="text-sm">No design</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CropArea({
  image,
  cropData,
  onCropAreaChange
}: {
  image: File;
  cropData: { x: number; y: number; width: number; height: number };
  onCropAreaChange: (cropData: { x: number; y: number; width: number; height: number }) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      const newCropData = { ...cropData };

      switch (true) {
        case e.target instanceof Element && e.target.classList.contains('crop-handle-tl'):
          newCropData.x += deltaX;
          newCropData.y += deltaY;
          newCropData.width -= deltaX;
          newCropData.height -= deltaY;
          break;
        case e.target instanceof Element && e.target.classList.contains('crop-handle-tr'):
          newCropData.y += deltaY;
          newCropData.width += deltaX;
          newCropData.height -= deltaY;
          break;
        case e.target instanceof Element && e.target.classList.contains('crop-handle-bl'):
          newCropData.x += deltaX;
          newCropData.width -= deltaX;
          newCropData.height += deltaY;
          break;
        case e.target instanceof Element && e.target.classList.contains('crop-handle-br'):
          newCropData.width += deltaX;
          newCropData.height += deltaY;
          break;
      }

      // Ensure minimum size
      newCropData.width = Math.max(50, newCropData.width);
      newCropData.height = Math.max(50, newCropData.height);

      onCropAreaChange(newCropData);
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, cropData, onCropAreaChange]);

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      <img
        src={URL.createObjectURL(image)}
        alt="Crop area"
        className="w-full h-full object-contain"
        draggable={false}
      />

      {/* Crop overlay */}
      <div
        className="absolute border-2 border-pink-500 bg-pink-500/20 pointer-events-none"
        style={{
          left: cropData.x,
          top: cropData.y,
          width: cropData.width,
          height: cropData.height,
        }}
      />

      {/* Crop handles */}
      <div
        className="crop-handle crop-handle-tl absolute w-4 h-4 bg-pink-500 border border-pink-700 cursor-nw-resize"
        style={{ left: cropData.x - 2, top: cropData.y - 2 }}
        onMouseDown={(e) => handleMouseDown(e, 'tl')}
      />
      <div
        className="crop-handle crop-handle-tr absolute w-4 h-4 bg-pink-500 border border-pink-700 cursor-ne-resize"
        style={{ left: cropData.x + cropData.width - 2, top: cropData.y - 2 }}
        onMouseDown={(e) => handleMouseDown(e, 'tr')}
      />
      <div
        className="crop-handle crop-handle-bl absolute w-4 h-4 bg-pink-500 border border-pink-700 cursor-sw-resize"
        style={{ left: cropData.x - 2, top: cropData.y + cropData.height - 2 }}
        onMouseDown={(e) => handleMouseDown(e, 'bl')}
      />
      <div
        className="crop-handle crop-handle-br absolute w-4 h-4 bg-pink-500 border border-pink-700 cursor-se-resize"
        style={{ left: cropData.x + cropData.width - 2, top: cropData.y + cropData.height - 2 }}
        onMouseDown={(e) => handleMouseDown(e, 'br')}
      />
    </div>
  );
}

export default function MiddleSection({
  className = '',
  placedImages,
  selectedImage,
  onSelectImage,
  onImageTransform,
  onRemoveImage,
  cropImage,
  cropData,
  onCropAreaChange,
  modelAngle,
  onModelAngleChange,
}: MiddleSectionProps) {
  return (
    <div className={`${className} p-8`}>
      <div className="h-full flex items-center justify-center gap-8">
        {/* Left Column - Sleeves */}
        <div className="flex flex-col gap-6 w-48">
          <TShirtSection
            title="LEFT SLEEVE"
            section="leftSleeve"
            placedImages={placedImages}
            selectedImage={selectedImage}
            onSelectImage={onSelectImage}
            onImageTransform={onImageTransform}
            onRemoveImage={onRemoveImage}
          />
          <TShirtSection
            title="RIGHT SLEEVE"
            section="rightSleeve"
            placedImages={placedImages}
            selectedImage={selectedImage}
            onSelectImage={onSelectImage}
            onImageTransform={onImageTransform}
            onRemoveImage={onRemoveImage}
          />
        </div>

        {/* Center Column - Crop Area & Front/Back */}
        <div className="flex flex-col gap-6 items-center">
          {/* Crop Area */}
          {cropImage && (
            <div className="w-96 h-64 bg-white rounded-lg border-2 border-gray-200 p-4">
              <h3 className="text-center text-gray-800 mb-4">Crop Image</h3>
              <CropArea
                image={cropImage}
                cropData={cropData}
                onCropAreaChange={onCropAreaChange}
              />
            </div>
          )}

          {/* Front and Back */}
          <div className="flex gap-6">
            <TShirtSection
              title="FRONT"
              section="front"
              placedImages={placedImages}
              selectedImage={selectedImage}
              onSelectImage={onSelectImage}
              onImageTransform={onImageTransform}
              onRemoveImage={onRemoveImage}
            />
            <TShirtSection
              title="BACK"
              section="back"
              placedImages={placedImages}
              selectedImage={selectedImage}
              onSelectImage={onSelectImage}
              onImageTransform={onImageTransform}
              onRemoveImage={onRemoveImage}
            />
          </div>
        </div>

        {/* Right Column - 3D Model Controls */}
        <div className="w-48 flex flex-col items-center gap-4">
          <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
            <h3 className="text-center text-gray-800 mb-4">3D View</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['front', 'back', 'left', 'right'] as const).map((angle) => (
                <button
                  key={angle}
                  onClick={() => onModelAngleChange(angle)}
                  className={`px-3 py-2 text-xs rounded capitalize transition-colors ${
                    modelAngle === angle
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {angle}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
