'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
// Dynamically import Scene3D to avoid SSR issues with Three.js
const Scene3D = dynamic(() => import('../components/Scene3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading 3D Scene...</p>
      </div>
    </div>
  )
});

interface CropTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  cropLeft: number;
  cropRight: number;
  cropTop: number;
  cropBottom: number;
}

type ContainerType = 'front' | 'back' | 'leftSleeve' | 'rightSleeve';

// Unified Image Control Component Props
interface UnifiedImageControlProps {
  image: string;
  transforms: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    cropLeft: number;
    cropRight: number;
    cropTop: number;
    cropBottom: number;
  };
  onTransform: React.Dispatch<React.SetStateAction<any>>;
  onDragStart: (event: React.MouseEvent) => void;
  onDragMove: (event: React.MouseEvent) => void;
  onDragEnd: () => void;
  onContextMenu: (x: number, y: number) => void;
  isDragging: boolean;

}

// Unified Image Control Component - Clean Mockey.ai Style
function UnifiedImageControl({
  image,
  transforms,
  onTransform,
  onDragStart,
  onDragMove,
  onDragEnd,
  isDragging,

}: UnifiedImageControlProps) {
  return (
    <div
      className="absolute z-10"
      style={{
        transform: `translate3d(${transforms.x}px, ${transforms.y}px, 0)`,
        width: 'fit-content',
        height: 'fit-content',
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
      }}
    >
      {/* Main Image with Handles */}
      <div className="relative group">
        {/* Design Image */}
        <img
          src={image}
          alt="Design"
          className="select-none block cursor-move relative z-10"
          style={{
            transform: `scale(${transforms.scale / 100}) rotate(${transforms.rotation}deg)`,
            maxWidth: '300px',
            maxHeight: '300px',
          }}
          draggable={false}
          onMouseDown={onDragStart}
          onContextMenu={(e) => {
            e.preventDefault();
            // Show context menu at cursor position
            const rect = e.currentTarget.getBoundingClientRect();
            const imageX = e.clientX - rect.left;
            const imageY = e.clientY - rect.top;

            // Show context menu
            if (typeof window !== 'undefined') {
              setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
              });
            }
          }}
        />

        {/* Drag Area */}
        <div
          className="absolute inset-0 cursor-move z-20"
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
        />

        {/* Floating Toolbar - Top (appears on hover) */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600 font-medium">Scale:</span>
              <span className="text-xs font-bold text-pink-600">{transforms.scale}%</span>
              <input
                type="range"
                min="20"
                max="300"
                value={transforms.scale}
                onChange={(e) => onTransform((prev: any) => ({ ...prev, scale: parseInt(e.target.value) }))}
                className="w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Floating Toolbar - Bottom (appears on hover) */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onTransform((prev: any) => ({ ...prev, x: 0, y: 0, scale: 60, rotation: 0, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 }))}
                className="px-2 py-1 text-xs text-pink-600 hover:text-pink-700 font-medium bg-white/90 rounded"
              >
                Reset
              </button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button
                onClick={() => onTransform((prev: any) => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                90°
              </button>
              <button
                onClick={() => onTransform((prev: any) => ({ ...prev, rotation: (prev.rotation - 90 + 360) % 360 }))}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                -90°
              </button>
              <button
                onClick={() => onTransform((prev: any) => ({ ...prev, rotation: (prev.rotation + 180) % 360 }))}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                Flip
              </button>
            </div>
          </div>
        </div>

        {/* Modern Corner Resize Handles - Blue/White Design */}
        {[
          { cursor: 'nw-resize', position: 'top-left' },
          { cursor: 'ne-resize', position: 'top-right' },
          { cursor: 'sw-resize', position: 'bottom-left' },
          { cursor: 'se-resize', position: 'bottom-right' },
        ].map(({ cursor, position }) => (
          <div
            key={position}
            className={`absolute w-5 h-5 bg-white border-2 border-blue-500 cursor-${cursor} hover:bg-blue-50 hover:border-blue-600 hover:scale-110 transition-all z-40 shadow-sm`}
            style={{
              [position.includes('top') ? 'top' : 'bottom']: '-10px',
              [position.includes('left') ? 'left' : 'right']: '-10px',
              borderRadius: '50%',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              const startScale = transforms.scale;
              const startMouseX = e.clientX;
              const startMouseY = e.clientY;

              const handleResize = (moveEvent: MouseEvent) => {
                const deltaX = position.includes('left') ? startMouseX - moveEvent.clientX : moveEvent.clientX - startMouseX;
                const deltaY = position.includes('top') ? startMouseY - moveEvent.clientY : moveEvent.clientY - startMouseY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                const newScale = Math.max(20, Math.min(300, startScale + distance * 0.5));
                onTransform((prev: any) => ({ ...prev, scale: Math.round(newScale) }));
              };

              const handleEnd = () => {
                document.removeEventListener('mousemove', handleResize);
                document.removeEventListener('mouseup', handleEnd);
              };

              document.addEventListener('mousemove', handleResize);
              document.addEventListener('mouseup', handleEnd);
            }}
          />
        ))}

        {/* Modern Rotation Handle - Blue/White Design */}
        <div
          className="absolute -top-16 -right-16 w-7 h-7 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-600 hover:scale-110 transition-all z-40 shadow-sm"
          onMouseDown={(e) => {
            e.stopPropagation();
            const startRotation = transforms.rotation;
            const startMouseX = e.clientX;

            const handleRotate = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - startMouseX;
              const newRotation = startRotation + (deltaX * 0.5);
              onTransform((prev: any) => ({ ...prev, rotation: Math.max(-180, Math.min(180, newRotation)) }));
            };

            const handleEnd = () => {
              document.removeEventListener('mousemove', handleRotate);
              document.removeEventListener('mouseup', handleEnd);
            };

            document.addEventListener('mousemove', handleRotate);
            document.addEventListener('mouseup', handleEnd);
          }}
        >
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  const [image, setImage] = useState<string | null>(null);
  const [tshirtColor, setTshirtColor] = useState('#ffffff');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unified image control system (mockey.ai style)
  const [imageTransforms, setImageTransforms] = useState({
    x: 0,
    y: 0,
    scale: 60,
    rotation: 0,
    cropLeft: 0,
    cropRight: 0,
    cropTop: 0,
    cropBottom: 0,
  });

  // Dragging state for unified image control
  const [dragging, setDragging] = useState<{ isDragging: boolean; startX: number; startY: number; type: 'move' | 'resize' | 'rotate' | 'crop' } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number } | null>(null);

  // Context menu handler
  const handleContextMenu = (x: number, y: number) => {
    setContextMenu({ visible: true, x, y });
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
    }
  };

  // Unified image dragging handlers
  const handleImageMouseDown = (event: React.MouseEvent) => {
    if (!image) return;
    event.preventDefault();
    event.stopPropagation();

    setDragging({
      isDragging: true,
      startX: event.clientX - imageTransforms.x,
      startY: event.clientY - imageTransforms.y,
      type: 'move',
    });
  };

  const handleImageMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragging || !dragging.isDragging || dragging.type !== 'move') return;

    const newX = event.clientX - dragging.startX;
    const newY = event.clientY - dragging.startY;

    // Update image position immediately for smooth dragging
    setImageTransforms(prev => ({ ...prev, x: newX, y: newY }));
  }, [dragging]);

  const handleImageMouseUp = () => {
    setDragging(null);
  };

  // Unified container interaction handlers
  const handleMouseDown = (container: ContainerType, event: React.MouseEvent) => {
    if (!image) return;
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    setDragging({
      isDragging: true,
      startX: event.clientX - rect.left,
      startY: event.clientY - rect.top,
      type: 'move',
    });
  };

  const handleMouseMove = useCallback((event: React.MouseEvent, containerType: ContainerType) => {
    if (!dragging || !dragging.isDragging || dragging.type !== 'move') return;

    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const deltaX = x - dragging.startX;
    const deltaY = y - dragging.startY;

    // Update unified transforms immediately for direct cursor tracking - no delay
    setImageTransforms(prev => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    setDragging({
      ...dragging,
      startX: x,
      startY: y,
    });
  }, [dragging]);

  const handleMouseUp = () => {
    setDragging(null);
  };

  // Unified image manipulation handlers
  const handleScaleChange = (scale: number) => {
    setImageTransforms(prev => ({
      ...prev,
      scale: Math.max(20, Math.min(300, scale)),
    }));
  };

  const handleCropChange = (edge: 'left' | 'right' | 'top' | 'bottom', cropValue: number) => {
    setImageTransforms(prev => ({
      ...prev,
      [edge === 'left' ? 'cropLeft' : edge === 'right' ? 'cropRight' : edge === 'top' ? 'cropTop' : 'cropBottom']: Math.max(0, Math.min(200, cropValue))
    }));
  };

  const handleEdgeCrop = (edge: 'left' | 'right' | 'top' | 'bottom', delta: number) => {
    setImageTransforms(prev => {
      const currentCrop = prev[edge === 'left' ? 'cropLeft' : edge === 'right' ? 'cropRight' : edge === 'top' ? 'cropTop' : 'cropBottom'];
      // Intuitive: dragging outward (positive delta) = decrease crop (show more)
      // Dragging inward (negative delta) = increase crop (show less)
      const cropChange = -delta * 0.5;
      const newCrop = Math.max(0, Math.min(200, currentCrop + cropChange));

      return {
        ...prev,
        [edge === 'left' ? 'cropLeft' : edge === 'right' ? 'cropRight' : edge === 'top' ? 'cropTop' : 'cropBottom']: Math.round(newCrop)
      };
    });
  };

  const handleRotationChange = (rotation: number) => {
    setImageTransforms(prev => ({
      ...prev,
      rotation: rotation,
    }));
  };

  // Unified image scale handler
  const handleImageScaleChange = (scale: number) => {
    setImageTransforms(prev => ({
      ...prev,
      scale: Math.max(20, Math.min(300, scale)),
    }));
  };

  // Unified image rotation handler
  const handleImageRotationChange = (rotation: number) => {
    setImageTransforms(prev => ({
      ...prev,
      rotation: Math.max(-180, Math.min(180, rotation)),
    }));
  };

  // Unified image manipulation handlers
  const handleCropToRatio = (ratio: 'square' | '4:3' | '3:4' | '16:9' | '9:16') => {
    if (!image) return;

    const ratios = {
      'square': { width: 1, height: 1 },
      '4:3': { width: 4, height: 3 },
      '3:4': { width: 3, height: 4 },
      '16:9': { width: 16, height: 9 },
      '9:16': { width: 9, height: 16 }
    };

    const { width, height } = ratios[ratio];
    const maxSize = 200;
    const newWidth = Math.min(maxSize, width * 50);
    const newHeight = Math.min(maxSize, height * 50);

    setImageTransforms(prev => ({
      ...prev,
      cropLeft: Math.max(0, (maxSize - newWidth) / 2),
      cropRight: Math.max(0, (maxSize - newWidth) / 2),
      cropTop: Math.max(0, (maxSize - newHeight) / 2),
      cropBottom: Math.max(0, (maxSize - newHeight) / 2),
    }));
  };

  const handleFitToArea = () => {
    if (!image) return;

    setImageTransforms(prev => ({
      ...prev,
      cropLeft: 0,
      cropRight: 0,
      cropTop: 0,
      cropBottom: 0,
      scale: 100,
    }));
  };

  const handleFlipHorizontal = () => {
    setImageTransforms(prev => ({
      ...prev,
      rotation: (prev.rotation + 180) % 360,
    }));
  };

  const handleFlipVertical = () => {
    setImageTransforms(prev => ({
      ...prev,
      rotation: (prev.rotation + 180) % 360,
      scale: prev.scale * -1,
    }));
  };

  const handleRotate90Clockwise = () => {
    setImageTransforms(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const handleRotate90CounterClockwise = () => {
    setImageTransforms(prev => ({
      ...prev,
      rotation: (prev.rotation - 90 + 360) % 360,
    }));
  };

  const handleCenterImage = () => {
    setImageTransforms(prev => ({ ...prev, x: 0, y: 0 }));
  };

  const handleResetAll = () => {
    setImageTransforms({
      x: 0,
      y: 0,
      scale: 60,
      rotation: 0,
      cropLeft: 0,
      cropRight: 0,
      cropTop: 0,
      cropBottom: 0,
    });
  };

  const renderContainer = (
    container: ContainerType,
    title: string,
    dimensions: string,
    aspectRatio: string,
    containerSize: string
  ) => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-3 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-800">{title}</div>
        </div>

        {/* Clean White Container */}
        <div className="p-4">
          <div className={`${containerSize} bg-white border-2 border-dashed border-gray-300 rounded-lg relative overflow-hidden`}>
            {/* Empty white container - no text, no controls */}
          </div>
        </div>
      </div>
    );
  };

  // Close context menu when clicking outside
  const handleClickOutside = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex" onClick={handleClickOutside}>
      {/* Left Sidebar - Upload & Settings */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-500 to-purple-600">
          <h1 className="text-xl font-bold text-white">T-Shirt Designer</h1>
          <p className="text-pink-100 text-sm mt-1">Customize your design</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Upload Design</label>
            <button
              onClick={handleUpload}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium shadow-md transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choose Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">Supports: PNG, JPG, SVG</p>
          </div>

          {/* Current Image Preview */}
          {image && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Current Design</label>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <img src={image} alt="Current design" className="w-full h-32 object-contain" />
                <button
                  onClick={() => setImage(null)}
                  className="w-full mt-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Remove Design
                </button>
              </div>
            </div>
          )}

          {/* Color Picker */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">T-Shirt Color</label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={tshirtColor}
                  onChange={(e) => setTshirtColor(e.target.value)}
                  className="w-14 h-14 rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm"
                />
              </div>
              <input
                type="text"
                value={tshirtColor}
                onChange={(e) => setTshirtColor(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Image Manipulation Controls */}
          {image && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Crop & Resize</label>

              {/* Crop Ratio Buttons */}
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Crop to Ratio:</p>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { label: '1:1', ratio: 'square' as const },
                    { label: '4:3', ratio: '4:3' as const },
                    { label: '3:4', ratio: '3:4' as const },
                    { label: '16:9', ratio: '16:9' as const },
                    { label: '9:16', ratio: '9:16' as const },
                    { label: 'Fit', ratio: null as any },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => item.ratio ? handleCropToRatio(item.ratio) : handleFitToArea()}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transform Buttons */}
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Transform:</p>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={handleRotate90Clockwise}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    90°
                  </button>
                  <button
                    onClick={handleRotate90CounterClockwise}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    -90°
                  </button>
                  <button
                    onClick={handleFlipHorizontal}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Flip H
                  </button>
                  <button
                    onClick={handleFlipVertical}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m1 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Flip V
                  </button>
                </div>
              </div>

              {/* Position Buttons */}
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Position:</p>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={handleCenterImage}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                  >
                    Center
                  </button>
                  <button
                    onClick={() => setImageTransforms(prev => ({ ...prev, y: prev.y - 20 }))}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                  >
                    ↑ Up
                  </button>
                  <button
                    onClick={() => setImageTransforms(prev => ({ ...prev, y: prev.y + 20 }))}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                  >
                    ↓ Down
                  </button>
                  <button
                    onClick={() => setImageTransforms(prev => ({ ...prev, x: prev.x - 20 }))}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                  >
                    ← Left
                  </button>
                  <button
                    onClick={() => setImageTransforms(prev => ({ ...prev, x: prev.x + 20 }))}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                  >
                    → Right
                  </button>
                  <button
                    onClick={handleResetAll}
                    className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              </div>

              {/* Quick Scale Buttons */}
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Quick Scale:</p>
                <div className="grid grid-cols-4 gap-1">
                  {[25, 50, 75, 100].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => handleImageScaleChange(scale)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${imageTransforms.scale === scale
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                      {scale}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-blue-800 space-y-1">
                <p className="font-semibold">How to use:</p>
                <p>• Upload your design image</p>
                <p>• Use crop buttons for quick ratios</p>
                <p>• Drag corners to resize manually</p>
                <p>• Use transform buttons to rotate/flip</p>
                <p>• View real-time 3D preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Area - Design Image Overlaid on Containers */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Design Placement</h2>
            <p className="text-gray-600">Position your design over all printing surfaces</p>
          </div>

          {/* Design Overlay + Container Grid */}
          <div className="relative max-w-4xl mx-auto">
            {/* Large invisible boundary rectangle */}
            <div className="relative w-full h-[600px] border-2 border-transparent bg-gray-50/30 rounded-lg">
              {/* Top row: Left and Right Sleeves (smaller) */}
              <div className="flex justify-center gap-8 mb-8 pt-6">
                <div className="w-40 h-28 bg-white rounded-lg shadow-md border border-gray-200 flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-500">LEFT SLEEVE</span>
                </div>
                <div className="w-40 h-28 bg-white rounded-lg shadow-md border border-gray-200 flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-500">RIGHT SLEEVE</span>
                </div>
              </div>

              {/* Bottom row: Front and Back (larger) */}
              <div className="flex justify-center gap-12 px-8">
                <div className="w-56 h-36 bg-white rounded-lg shadow-md border border-gray-200 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-500">FRONT</span>
                </div>
                <div className="w-56 h-36 bg-white rounded-lg shadow-md border border-gray-200 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-500">BACK</span>
                </div>
              </div>

              {/* Unified Image Control Component */}
              {image && (
                <UnifiedImageControl
                  image={image}
                  transforms={imageTransforms}
                  onTransform={setImageTransforms}
                  onDragStart={handleImageMouseDown}
                  onDragMove={handleImageMouseMove}
                  onDragEnd={handleImageMouseUp}
                  onContextMenu={handleContextMenu}
                  isDragging={dragging?.isDragging || false}
                />
              )}

              {/* Floating Context Menu */}
              {contextMenu?.visible && (
                <div
                  className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-2 min-w-48"
                  style={{
                    left: contextMenu.x,
                    top: contextMenu.y,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 text-xs font-semibold text-gray-700 border-b border-gray-100">
                    Image Actions
                  </div>

                  <button
                    onClick={() => {
                      setImageTransforms({
                        x: 0,
                        y: 0,
                        scale: 60,
                        rotation: 0,
                        cropLeft: 0,
                        cropRight: 0,
                        cropTop: 0,
                        cropBottom: 0,
                      });
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset Transform
                  </button>

                  <button
                    onClick={() => {
                      setImageTransforms((prev: any) => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m1 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Rotate 90°
                  </button>

                  <button
                    onClick={() => {
                      setImageTransforms((prev: any) => ({ ...prev, rotation: (prev.rotation + 180) % 360 }));
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Flip Horizontal
                  </button>

                  <button
                    onClick={() => {
                      setImageTransforms((prev: any) => ({ ...prev, scale: Math.max(20, prev.scale - 10) }));
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M12 20l-8-8 8-8" />
                    </svg>
                    Scale Down
                  </button>

                  <button
                    onClick={() => {
                      setImageTransforms((prev: any) => ({ ...prev, scale: Math.min(300, prev.scale + 10) }));
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M12 4l8 8-8 8" />
                    </svg>
                    Scale Up
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    onClick={() => {
                      setImage(null);
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Image
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upload prompt when no image */}
          {!image && (
            <div className="text-center mt-12 p-12 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to Start?</h3>
              <p className="text-gray-600 mb-6">Upload your design to place it across all printing surfaces!</p>
              <button
                onClick={handleUpload}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg transition-all duration-200"
              >
                Upload Design Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - 3D Preview */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-lg">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-600">
          <h2 className="text-xl font-bold text-white">3D Preview</h2>
          <p className="text-purple-100 text-sm mt-1">Live view of your design</p>
        </div>

        <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100">
          <Scene3D
            className="absolute inset-0"
            colors={{
              body: tshirtColor,
              neck: tshirtColor,
              neckBorder: tshirtColor,
              cuff: tshirtColor,
              buttons: tshirtColor,
              ribbedHem: tshirtColor,
            }}
            textures={image ? {
              front: image,
              back: image,
              leftSleeve: image,
              rightSleeve: image,
            } : {}}
            textureTransforms={{
              front: {
                position: { x: imageTransforms.x / 200, y: -imageTransforms.y / 200 },
                scale: imageTransforms.scale,
                rotation: imageTransforms.rotation
              },
              back: {
                position: { x: imageTransforms.x / 200, y: -imageTransforms.y / 200 },
                scale: imageTransforms.scale,
                rotation: imageTransforms.rotation
              },
              leftSleeve: {
                position: { x: imageTransforms.x / 200, y: -imageTransforms.y / 200 },
                scale: imageTransforms.scale,
                rotation: imageTransforms.rotation
              },
              rightSleeve: {
                position: { x: imageTransforms.x / 200, y: -imageTransforms.y / 200 },
                scale: imageTransforms.scale,
                rotation: imageTransforms.rotation
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
