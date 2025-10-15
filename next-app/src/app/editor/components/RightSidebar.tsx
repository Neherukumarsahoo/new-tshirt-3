'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import Scene3D to avoid SSR issues with Three.js
const Scene3D = dynamic(() => import('../../components/Scene3D'), {
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

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

interface RightSidebarProps {
  className?: string;
  placedImages: PlacedImage[];
  colors: {
    body: string;
    neck: string;
    neckBorder: string;
    cuff: string;
    buttons: string;
    ribbedHem: string;
  };
  onColorChange: (part: string, color: string) => void;
}

export default function RightSidebar({
  className = '',
  placedImages,
  colors,
  onColorChange
}: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'3d' | 'colors'>('3d');

  return (
    <div className={`bg-white border-l border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-800">Preview</h1>
          <button
            onClick={() => setActiveTab(activeTab === '3d' ? 'colors' : '3d')}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
            </svg>
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('3d')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === '3d'
                ? 'bg-pink-100 text-pink-700 border border-pink-200'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            3D View
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'colors'
                ? 'bg-pink-100 text-pink-700 border border-pink-200'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Colors
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === '3d' && (
          <div className="h-full relative bg-gradient-to-br from-gray-100 to-gray-200">
            <Scene3D
              className="absolute inset-0"
              colors={colors}
            />

            {/* 3D Controls */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="text-xs text-gray-600 mb-2">3D Controls</div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded text-xs" title="Rotate">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded text-xs" title="Zoom">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded text-xs" title="Pan">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Image indicators */}
            {placedImages.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="text-xs text-gray-600 mb-2">Applied Images</div>
                <div className="flex flex-wrap gap-1">
                  {placedImages.map((image) => (
                    <div key={image.id} className="w-8 h-8 bg-gray-200 rounded border overflow-hidden">
                      <img
                        src={image.url}
                        alt="Applied"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">T-SHIRT COLORS</h3>

              <ColorPicker
                label="Body"
                value={colors.body}
                onChange={(color) => onColorChange('body', color)}
              />
              <ColorPicker
                label="Neck"
                value={colors.neck}
                onChange={(color) => onColorChange('neck', color)}
              />
              <ColorPicker
                label="Neck Border"
                value={colors.neckBorder}
                onChange={(color) => onColorChange('neckBorder', color)}
              />
              <ColorPicker
                label="Cuff"
                value={colors.cuff}
                onChange={(color) => onColorChange('cuff', color)}
              />
              <ColorPicker
                label="Buttons"
                value={colors.buttons}
                onChange={(color) => onColorChange('buttons', color)}
              />
              <ColorPicker
                label="Ribbed Hem"
                value={colors.ribbedHem}
                onChange={(color) => onColorChange('ribbedHem', color)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
