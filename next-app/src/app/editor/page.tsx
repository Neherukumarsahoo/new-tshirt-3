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

export default function EditorPage() {
  const [image, setImage] = useState<string | null>(null);
  const [tshirtColor, setTshirtColor] = useState('#ffffff');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Separate crop transforms for each container (mockey.ai style cropping)
  const [cropTransforms, setCropTransforms] = useState<Record<ContainerType, CropTransform>>({
    front: { x: 0, y: 0, scale: 60, rotation: 0, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 }, // Reduced to 60% for better fit
    back: { x: 0, y: 0, scale: 60, rotation: 0, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 },
    leftSleeve: { x: 0, y: 0, scale: 50, rotation: 0, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 },
    rightSleeve: { x: 0, y: 0, scale: 50, rotation: 0, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 },
  });

  // Independent draggable image position (separate from container transforms)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 }); // Start at center
  const [imageScale, setImageScale] = useState(60);
  const [imageRotation, setImageRotation] = useState(0);

  // Dragging state for the independent image
  const [dragging, setDragging] = useState<{ isDragging: boolean; startX: number; startY: number } | null>(null);

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

  // New independent image dragging handlers
  const handleImageMouseDown = (event: React.MouseEvent) => {
    if (!image) return;
    event.preventDefault();
    event.stopPropagation();

    setDragging({
      isDragging: true,
      startX: event.clientX - imagePosition.x,
      startY: event.clientY - imagePosition.y,
    });
  };

  const handleImageMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragging || !dragging.isDragging) return;

    const newX = event.clientX - dragging.startX;
    const newY = event.clientY - dragging.startY;

    // Update image position immediately for smooth dragging
    setImagePosition({ x: newX, y: newY });
  }, [dragging]);

  const handleImageMouseUp = () => {
    setDragging(null);
  };

  // Keep old handlers for container interactions (if needed)
  const handleMouseDown = (container: ContainerType, event: React.MouseEvent) => {
    if (!image) return;
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    setDragging({
      isDragging: true,
      startX: event.clientX - rect.left,
      startY: event.clientY - rect.top,
    });
  };

  const handleMouseMove = useCallback((event: React.MouseEvent, containerType: ContainerType) => {
    if (!dragging || !dragging.isDragging) return;

    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const deltaX = x - dragging.startX;
    const deltaY = y - dragging.startY;

    // Update transforms immediately for direct cursor tracking - no delay
    setCropTransforms(prev => ({
      ...prev,
      [containerType]: {
        ...prev[containerType],
        x: prev[containerType].x + deltaX,
        y: prev[containerType].y + deltaY,
      }
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

  const handleScaleChange = (container: ContainerType, scale: number) => {
    setCropTransforms(prev => ({
      ...prev,
      [container]: {
        ...prev[container],
        scale: Math.max(20, Math.min(300, scale)),
      }
    }));
  };

  const handleReset = (container: ContainerType) => {
    const defaultScale = container === 'leftSleeve' || container === 'rightSleeve' ? 80 : 100;
    setCropTransforms(prev => ({
      ...prev,
      [container]: { x: 0, y: 0, scale: defaultScale, rotation: 0, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 },
    }));
  };

  const handleCropChange = (container: ContainerType, edge: 'left' | 'right' | 'top' | 'bottom', cropValue: number) => {
    setCropTransforms(prev => ({
      ...prev,
      [container]: {
        ...prev[container],
        [edge === 'left' ? 'cropLeft' : edge === 'right' ? 'cropRight' : edge === 'top' ? 'cropTop' : 'cropBottom']: Math.max(0, Math.min(200, cropValue))
      }
    }));
  };

  const handleEdgeCrop = (container: ContainerType, edge: 'left' | 'right' | 'top' | 'bottom', delta: number) => {
    setCropTransforms(prev => {
      const currentCrop = prev[container][edge === 'left' ? 'cropLeft' : edge === 'right' ? 'cropRight' : edge === 'top' ? 'cropTop' : 'cropBottom'];
      // Intuitive: dragging outward (positive delta) = decrease crop (show more)
      // Dragging inward (negative delta) = increase crop (show less)
      const cropChange = -delta * 0.5;
      const newCrop = Math.max(0, Math.min(200, currentCrop + cropChange));

      return {
        ...prev,
        [container]: {
          ...prev[container],
          [edge === 'left' ? 'cropLeft' : edge === 'right' ? 'cropRight' : edge === 'top' ? 'cropTop' : 'cropBottom']: Math.round(newCrop)
        }
      };
    });
  };

  const handleRotationChange = (container: ContainerType, rotation: number) => {
    setCropTransforms(prev => ({
      ...prev,
      [container]: {
        ...prev[container],
        rotation: rotation,
      }
    }));
  };

  // Independent image scale handler
  const handleImageScaleChange = (scale: number) => {
    setImageScale(Math.max(20, Math.min(300, scale)));
  };

  // Independent image rotation handler
  const handleImageRotationChange = (rotation: number) => {
    setImageRotation(Math.max(-180, Math.min(180, rotation)));
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

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
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

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-blue-800 space-y-1">
                <p className="font-semibold">How to use:</p>
                <p>• Upload your design image</p>
                <p>• Drag to position in each area</p>
                <p>• Use sliders to adjust scale</p>
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

              {/* Independent Draggable Image - Positioned at Bottom */}
              {image && (
                <div
                  className="absolute z-10"
                  style={{
                    transform: `translate3d(${imagePosition.x}px, ${imagePosition.y}px, 0)`,
                    width: 'fit-content',
                    height: 'fit-content',
                    transition: dragging?.isDragging ? 'none' : 'transform 0.1s ease-out',
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transformStyle: 'preserve-3d',
                    WebkitTransformStyle: 'preserve-3d',
                  }}
                >
                  {/* Image with Independent Transform Controls */}
                  <div className="relative group">
                    {/* Design Image - Independent Size and Position */}
                    <img
                      src={image}
                      alt="Design"
                      className="select-none block cursor-move"
                      style={{
                        transform: `scale(${imageScale / 100}) rotate(${imageRotation}deg)`,
                        maxWidth: '300px',
                        maxHeight: '300px',
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        userSelect: 'none',
                      }}
                      draggable={false}
                      onMouseDown={handleImageMouseDown}
                    />

                    {/* Invisible drag area for better UX */}
                    <div
                      className="absolute inset-0 cursor-move"
                      onMouseDown={handleImageMouseDown}
                      onMouseMove={handleImageMouseMove}
                      onMouseUp={handleImageMouseUp}
                      onMouseLeave={handleImageMouseUp}
                    ></div>

                    {/* Corner Resize Handles - Responsive to Image Scale */}
                    <div
                      className="absolute w-2 h-2 bg-red-500 border border-white transform rotate-45 cursor-nw-resize hover:scale-150 transition-transform"
                      style={{
                        top: `${-cropTransforms.front.cropTop - 2}px`,
                        left: `${-cropTransforms.front.cropLeft - 2}px`,
                        transform: `rotate(45deg) scale(${cropTransforms.front.scale / 100})`,
                        transformOrigin: 'center center',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startScale = cropTransforms.front.scale;
                        const startMouseX = e.clientX;
                        const startMouseY = e.clientY;

                        const handleCornerResize = (moveEvent: MouseEvent) => {
                          const deltaX = startMouseX - moveEvent.clientX;
                          const deltaY = startMouseY - moveEvent.clientY;
                          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                          const angle = Math.atan2(deltaY, deltaX);

                          let scaleChange = 0;
                          if (angle >= -Math.PI / 4 && angle <= Math.PI / 4) {
                            scaleChange = distance * 0.3;
                          } else {
                            scaleChange = -distance * 0.3;
                          }

                          const newScale = Math.max(20, Math.min(300, startScale + scaleChange));
                          handleScaleChange('front', Math.round(newScale));
                        };

                        const handleEnd = () => {
                          document.removeEventListener('mousemove', handleCornerResize);
                          document.removeEventListener('mouseup', handleEnd);
                        };

                        document.addEventListener('mousemove', handleCornerResize);
                        document.addEventListener('mouseup', handleEnd);
                      }}
                    ></div>
                    <div
                      className="absolute w-2 h-2 bg-red-500 border border-white transform rotate-45 cursor-ne-resize hover:scale-150 transition-transform"
                      style={{
                        top: `${-cropTransforms.front.cropTop - 2}px`,
                        right: `${-cropTransforms.front.cropRight - 2}px`,
                        transform: `rotate(45deg) scale(${cropTransforms.front.scale / 100})`,
                        transformOrigin: 'center center',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startScale = cropTransforms.front.scale;
                        const startMouseX = e.clientX;
                        const startMouseY = e.clientY;

                        const handleCornerResize = (moveEvent: MouseEvent) => {
                          const deltaX = moveEvent.clientX - startMouseX;
                          const deltaY = startMouseY - moveEvent.clientY;
                          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                          const angle = Math.atan2(deltaY, deltaX);

                          let scaleChange = 0;
                          if (angle >= -Math.PI / 4 && angle <= Math.PI / 4) {
                            scaleChange = distance * 0.3;
                          } else {
                            scaleChange = -distance * 0.3;
                          }

                          const newScale = Math.max(20, Math.min(300, startScale + scaleChange));
                          handleScaleChange('front', Math.round(newScale));
                        };

                        const handleEnd = () => {
                          document.removeEventListener('mousemove', handleCornerResize);
                          document.removeEventListener('mouseup', handleEnd);
                        };

                        document.addEventListener('mousemove', handleCornerResize);
                        document.addEventListener('mouseup', handleEnd);
                      }}
                    ></div>
                    <div
                      className="absolute w-2 h-2 bg-red-500 border border-white transform rotate-45 cursor-sw-resize hover:scale-150 transition-transform"
                      style={{
                        bottom: `${-cropTransforms.front.cropBottom - 2}px`,
                        left: `${-cropTransforms.front.cropLeft - 2}px`,
                        transform: `rotate(45deg) scale(${cropTransforms.front.scale / 100})`,
                        transformOrigin: 'center center',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startScale = cropTransforms.front.scale;
                        const startMouseX = e.clientX;
                        const startMouseY = e.clientY;

                        const handleCornerResize = (moveEvent: MouseEvent) => {
                          const deltaX = startMouseX - moveEvent.clientX;
                          const deltaY = moveEvent.clientY - startMouseY;
                          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                          const angle = Math.atan2(deltaY, deltaX);

                          let scaleChange = 0;
                          if (angle >= -Math.PI / 4 && angle <= Math.PI / 4) {
                            scaleChange = distance * 0.3;
                          } else {
                            scaleChange = -distance * 0.3;
                          }

                          const newScale = Math.max(20, Math.min(300, startScale + scaleChange));
                          handleScaleChange('front', Math.round(newScale));
                        };

                        const handleEnd = () => {
                          document.removeEventListener('mousemove', handleCornerResize);
                          document.removeEventListener('mouseup', handleEnd);
                        };

                        document.addEventListener('mousemove', handleCornerResize);
                        document.addEventListener('mouseup', handleEnd);
                      }}
                    ></div>
                    <div
                      className="absolute w-2 h-2 bg-red-500 border border-white transform rotate-45 cursor-se-resize hover:scale-150 transition-transform"
                      style={{
                        bottom: `${-cropTransforms.front.cropBottom - 2}px`,
                        right: `${-cropTransforms.front.cropRight - 2}px`,
                        transform: `rotate(45deg) scale(${cropTransforms.front.scale / 100})`,
                        transformOrigin: 'center center',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startScale = cropTransforms.front.scale;
                        const startMouseX = e.clientX;
                        const startMouseY = e.clientY;

                        const handleCornerResize = (moveEvent: MouseEvent) => {
                          const deltaX = moveEvent.clientX - startMouseX;
                          const deltaY = moveEvent.clientY - startMouseY;
                          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                          const angle = Math.atan2(deltaY, deltaX);

                          let scaleChange = 0;
                          if (angle >= -Math.PI / 4 && angle <= Math.PI / 4) {
                            scaleChange = distance * 0.3;
                          } else {
                            scaleChange = -distance * 0.3;
                          }

                          const newScale = Math.max(20, Math.min(300, startScale + scaleChange));
                          handleScaleChange('front', Math.round(newScale));
                        };

                        const handleEnd = () => {
                          document.removeEventListener('mousemove', handleCornerResize);
                          document.removeEventListener('mouseup', handleEnd);
                        };

                        document.addEventListener('mousemove', handleCornerResize);
                        document.addEventListener('mouseup', handleEnd);
                      }}
                    ></div>

                    {/* Edge Crop Handles - Responsive to Image Scale and Crop Values */}
                    <div
                      className="absolute w-4 h-1 bg-red-500 border border-white cursor-n-resize hover:scale-150 transition-transform"
                      style={{
                        top: `${-cropTransforms.front.cropTop - 2}px`,
                        left: '50%',
                        transform: `translateX(-50%) scale(${cropTransforms.front.scale / 100})`,
                        transformOrigin: 'center center',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startMouseY = e.clientY;

                        const handleTopCrop = (moveEvent: MouseEvent) => {
                          const deltaY = startMouseY - moveEvent.clientY;
                          handleEdgeCrop('front', 'top', deltaY);
                        };

                        const handleEnd = () => {
                          document.removeEventListener('mousemove', handleTopCrop);
                          document.removeEventListener('mouseup', handleEnd);
                        };

                        document.addEventListener('mousemove', handleTopCrop);
                        document.addEventListener('mouseup', handleEnd);
                      }}
                    ></div>
                    <div
                      className="absolute w-4 h-1 bg-red-500 border border-white cursor-s-resize hover:scale-150 transition-transform"
                      style={{
                        bottom: `${-cropTransforms.front.cropBottom - 2}px`,
                        left: '50%',
                        transform: `translateX(-50%) scale(${cropTransforms.front.scale / 100})`,
                        transformOrigin: 'center center',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startCrop = cropTransforms.front.cropBottom;
                        const startMouseY = e.clientY;

                        const handleBottomCrop = (moveEvent: MouseEvent) => {
                          const deltaY = moveEvent.clientY - startMouseY;
                          const cropChange = -deltaY * 0.5;
                          const newCrop = Math.max(0, Math.min(200, startCrop + cropChange));
                          handleCropChange('front', 'bottom', Math.round(newCrop));
                        };

                        const handleEnd = () => {
                          document.removeEventListener('mousemove', handleBottomCrop);
                          document.removeEventListener('mouseup', handleEnd);
                        };

                        document.addEventListener('mousemove', handleBottomCrop);
                        document.addEventListener('mouseup', handleEnd);
                      }}
                    ></div>
                    <div
                      className="absolute w-1 h-4 bg-red-500 border border-white cursor-w-resize hover:scale-150 transition-transform"
                      style={{
                        top: '50%',
                        left: `${-cropTransforms.front.cropLeft - 2}px`,
                        transform: `translateY(-50%) scale(${cropTransforms.front.scale / 100})`,
                        transformOrigin: 'center center',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startCrop = cropTransforms.front.cropLeft;
                        const startMouseX = e.clientX;

                        const handleLeftCrop = (moveEvent: MouseEvent) => {
                          const deltaX = startMouseX - moveEvent.clientX;
                          const cropChange = -deltaX * 0.5;
                          const newCrop = Math.max(0, Math.min(200, startCrop + cropChange));
                          handleCropChange('front', 'left', Math.round(newCrop));
                        };

                        const handleEnd = () => {
                          document.removeEventListener('mousemove', handleLeftCrop);
                          document.removeEventListener('mouseup', handleEnd);
                        };

                        document.addEventListener('mousemove', handleLeftCrop);
                        document.addEventListener('mouseup', handleEnd);
                      }}
                    ></div>
                    <div
                      className="absolute w-1 h-4 bg-red-500 border border-white cursor-e-resize hover:scale-150 transition-transform"
                      style={{
                        top: '50%',
                        right: `${-cropTransforms.front.cropRight - 2}px`,
                        transform: `translateY(-50%) scale(${cropTransforms.front.scale / 100})`,
                        transformOrigin: 'center center',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startCrop = cropTransforms.front.cropRight;
                        const startMouseX = e.clientX;

                        const handleRightCrop = (moveEvent: MouseEvent) => {
                          const deltaX = moveEvent.clientX - startMouseX;
                          const cropChange = -deltaX * 0.5;
                          const newCrop = Math.max(0, Math.min(200, startCrop + cropChange));
                          handleCropChange('front', 'right', Math.round(newCrop));
                        };

                        const handleEnd = () => {
                          document.removeEventListener('mousemove', handleRightCrop);
                          document.removeEventListener('mouseup', handleEnd);
                        };

                        document.addEventListener('mousemove', handleRightCrop);
                        document.addEventListener('mouseup', handleEnd);
                      }}
                    ></div>

                    {/* Rotation Control - Responsive to Image Scale */}
                    <div
                      className="absolute"
                      style={{
                        top: `${-cropTransforms.front.cropTop - 28}px`,
                        left: '50%',
                        transform: `translateX(-50%) scale(${cropTransforms.front.scale / 100})`,
                        transformOrigin: 'center center',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startRotation = cropTransforms.front.rotation;
                        const startMouseX = e.clientX;

                        const handleRotationMove = (moveEvent: MouseEvent) => {
                          const deltaX = moveEvent.clientX - startMouseX;
                          const newRotation = startRotation + (deltaX * 0.5);
                          handleRotationChange('front', Math.max(-180, Math.min(180, newRotation)));
                        };

                        const handleRotationEnd = () => {
                          document.removeEventListener('mousemove', handleRotationMove);
                          document.removeEventListener('mouseup', handleRotationEnd);
                        };

                        document.addEventListener('mousemove', handleRotationMove);
                        document.addEventListener('mouseup', handleRotationEnd);
                      }}
                    >
                      <div className="w-4 h-4 bg-red-500 rounded-full border border-white flex items-center justify-center cursor-pointer hover:scale-125 transition-transform">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reset Button for Independent Image */}
              {image && (
                <button
                  onClick={() => {
                    setImagePosition({ x: 0, y: 0 });
                    setImageScale(60);
                    setImageRotation(0);
                  }}
                  className="absolute top-2 right-2 z-20 text-xs text-pink-600 hover:text-pink-700 font-medium bg-white/90 px-2 py-1 rounded shadow"
                >
                  Reset
                </button>
              )}

              {/* Independent Image Scale Control */}
              {image && (
                <div className="absolute top-2 left-2 z-20 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-medium">Scale:</span>
                    <span className="text-xs font-bold text-pink-600">{imageScale}%</span>
                    <input
                      type="range"
                      min="20"
                      max="300"
                      value={imageScale}
                      onChange={(e) => handleImageScaleChange(parseInt(e.target.value))}
                      className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${(imageScale - 20) / 2.8}%, #e5e7eb ${(imageScale - 20) / 2.8}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
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
                position: { x: cropTransforms.front.x / 200, y: -cropTransforms.front.y / 200 },
                scale: cropTransforms.front.scale,
                rotation: cropTransforms.front.rotation
              },
              back: {
                position: { x: cropTransforms.back.x / 200, y: -cropTransforms.back.y / 200 },
                scale: cropTransforms.back.scale,
                rotation: cropTransforms.back.rotation
              },
              leftSleeve: {
                position: { x: cropTransforms.leftSleeve.x / 200, y: -cropTransforms.leftSleeve.y / 200 },
                scale: cropTransforms.leftSleeve.scale,
                rotation: cropTransforms.leftSleeve.rotation
              },
              rightSleeve: {
                position: { x: cropTransforms.rightSleeve.x / 200, y: -cropTransforms.rightSleeve.y / 200 },
                scale: cropTransforms.rightSleeve.scale,
                rotation: cropTransforms.rightSleeve.rotation
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
