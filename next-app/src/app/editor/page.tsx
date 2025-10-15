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
  const [tshirtColor, setTshirtColor] = useState('#ffffff');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Section-based images (mockey.ai logic - each section is independent)
  const [sectionImages, setSectionImages] = useState<Record<ContainerType, string | null>>({
    front: null,
    back: null,
    leftSleeve: null,
    rightSleeve: null,
  });

  // Section-based crop transforms (mockey.ai style cropping)
  const [cropTransforms, setCropTransforms] = useState<Record<ContainerType, CropTransform>>({
    front: { x: 0, y: 0, scale: 100, rotation: 0, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 },
    back: { x: 0, y: 0, scale: 100, rotation: 0, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 },
    leftSleeve: { x: 0, y: 0, scale: 80, rotation: 0, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 },
    rightSleeve: { x: 0, y: 0, scale: 80, rotation: 0, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 },
  });

  // Dragging state for section-based placement
  const [dragging, setDragging] = useState<{ isDragging: boolean; startX: number; startY: number; section: ContainerType } | null>(null);

  // Hover state for visual feedback
  const [hoveredSection, setHoveredSection] = useState<ContainerType | null>(null);

  // Tooltip state
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      // For now, place on front section as default
      setSectionImages(prev => ({
        ...prev,
        front: url
      }));
    }
  };

  // Section-based dragging handlers
  const handleSectionMouseDown = (section: ContainerType, event: React.PointerEvent) => {
    const sectionImage = sectionImages[section];
    if (!sectionImage) return;
    event.preventDefault();
    event.stopPropagation();

    try {
      (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    } catch (err) { }

    setDragging({
      isDragging: true,
      startX: event.clientX,
      startY: event.clientY,
      section
    });
  };

  const handleSectionMouseMove = useCallback((event: React.PointerEvent) => {
    if (!dragging || !dragging.isDragging) return;

    const deltaX = event.clientX - dragging.startX;
    const deltaY = event.clientY - dragging.startY;

    setCropTransforms(prev => ({
      ...prev,
      [dragging.section]: {
        ...prev[dragging.section],
        x: prev[dragging.section].x + deltaX,
        y: prev[dragging.section].y + deltaY,
      }
    }));

    setDragging({
      ...dragging,
      startX: event.clientX,
      startY: event.clientY,
    });
  }, [dragging]);

  const handleSectionMouseUp = (event?: React.PointerEvent) => {
    try {
      (event?.currentTarget as Element)?.releasePointerCapture?.((event as any)?.pointerId);
    } catch (_) { }

    setDragging(null);
  };




  const handleScaleChange = (container: ContainerType, scale: number) => {
    const clamped = Math.max(20, Math.min(300, scale));
    setCropTransforms(prev => ({
      ...prev,
      [container]: {
        ...prev[container],
        scale: clamped,
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

          {/* Section Status */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Section Status</label>
            <div className="space-y-2">
              {(['front', 'back', 'leftSleeve', 'rightSleeve'] as const).map((section) => (
                <div key={section} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                  <span className="text-sm capitalize">{section.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className="flex items-center gap-2">
                    {sectionImages[section] ? (
                      <>
                        <img src={sectionImages[section]} alt={`${section} design`} className="w-8 h-8 object-cover rounded" />
                        <button
                          onClick={() => setSectionImages(prev => ({ ...prev, [section]: null }))}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No image</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

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

          {/* Original T-Shirt Sections Layout */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-8">
              {/* Left and Right Sleeves */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 text-center">Sleeves</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(['leftSleeve', 'rightSleeve'] as const).map((section) => (
                    <div
                      key={section}
                      className={`relative bg-white rounded-lg shadow-md border-2 border-dashed h-32 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                        hoveredSection === section
                          ? 'border-pink-400 bg-pink-50 shadow-lg transform scale-105'
                          : sectionImages[section]
                            ? 'border-green-300 hover:border-green-400'
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onPointerDown={(e) => handleSectionMouseDown(section, e)}
                      onPointerMove={handleSectionMouseMove}
                      onPointerUp={handleSectionMouseUp}
                      onMouseEnter={(e) => {
                        setHoveredSection(section);
                        setTooltipPosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        if (hoveredSection) {
                          setTooltipPosition({ x: e.clientX, y: e.clientY });
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredSection(null);
                        setTooltipPosition(null);
                      }}
                    >
                      {sectionImages[section] ? (
                        <img
                          src={sectionImages[section]}
                          alt={`${section} design`}
                          className="w-full h-full object-contain p-2"
                          draggable={false}
                        />
                      ) : (
                        <div className="text-center text-gray-400">
                          <div className="text-2xl mb-2">👕</div>
                          <div className="text-xs font-medium">{section.replace(/([A-Z])/g, ' $1').trim()}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Front and Back */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 text-center">Body</h3>
                <div className="grid grid-cols-1 gap-4">
                  {(['front', 'back'] as const).map((section) => (
                    <div
                      key={section}
                      className={`relative bg-white rounded-lg shadow-md border-2 border-dashed h-40 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                        hoveredSection === section
                          ? 'border-pink-400 bg-pink-50 shadow-lg transform scale-105'
                          : sectionImages[section]
                            ? 'border-green-300 hover:border-green-400'
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onPointerDown={(e) => handleSectionMouseDown(section, e)}
                      onPointerMove={handleSectionMouseMove}
                      onPointerUp={handleSectionMouseUp}
                      onMouseEnter={() => setHoveredSection(section)}
                      onMouseLeave={() => setHoveredSection(null)}
                    >
                      {sectionImages[section] ? (
                        <img
                          src={sectionImages[section]}
                          alt={`${section} design`}
                          className="w-full h-full object-contain p-3"
                          draggable={false}
                        />
                      ) : (
                        <div className="text-center text-gray-400">
                          <div className="text-3xl mb-2">👕</div>
                          <div className="text-sm font-medium">{section.replace(/([A-Z])/g, ' $1').trim()}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section Controls */}
            <div className="mt-8 grid grid-cols-2 gap-8">
              {(['front', 'back', 'leftSleeve', 'rightSleeve'] as const).map((section) => (
                sectionImages[section] && (
                  <div key={section} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 capitalize">
                      {section.replace(/([A-Z])/g, ' $1').trim()} Controls
                    </h4>

                    {/* Scale Control */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scale: {cropTransforms[section].scale}%
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="300"
                        value={cropTransforms[section].scale}
                        onChange={(e) => handleScaleChange(section, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Position Controls */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          X: {cropTransforms[section].x}
                        </label>
                        <input
                          type="range"
                          min="-200"
                          max="200"
                          value={cropTransforms[section].x}
                          onChange={(e) => setCropTransforms(prev => ({
                            ...prev,
                            [section]: { ...prev[section], x: parseInt(e.target.value) }
                          }))}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Y: {cropTransforms[section].y}
                        </label>
                        <input
                          type="range"
                          min="-200"
                          max="200"
                          value={cropTransforms[section].y}
                          onChange={(e) => setCropTransforms(prev => ({
                            ...prev,
                            [section]: { ...prev[section], y: parseInt(e.target.value) }
                          }))}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Rotation Control */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rotation: {cropTransforms[section].rotation}°
                      </label>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={cropTransforms[section].rotation}
                        onChange={(e) => setCropTransforms(prev => ({
                          ...prev,
                          [section]: { ...prev[section], rotation: parseInt(e.target.value) }
                        }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Reset Button */}
                    <button
                      onClick={() => handleReset(section)}
                      className="w-full py-2 px-3 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
                    >
                      Reset {section.replace(/([A-Z])/g, ' $1').trim()}
                    </button>
                  </div>
                )
              ))}
            </div>
          </div>
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
            textures={{
              front: sectionImages.front || undefined,
              back: sectionImages.back || undefined,
              leftSleeve: sectionImages.leftSleeve || undefined,
              rightSleeve: sectionImages.rightSleeve || undefined,
            }}
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

      {/* Hover Tooltip */}
      {hoveredSection && tooltipPosition && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 10,
          }}
        >
          <div className="font-semibold capitalize mb-1">
            {hoveredSection.replace(/([A-Z])/g, ' $1').trim()}
          </div>
          <div className="text-gray-300">
            {sectionImages[hoveredSection]
              ? `Design applied • Scale: ${cropTransforms[hoveredSection].scale}%`
              : 'Click to add design'
            }
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
