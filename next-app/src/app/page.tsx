'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from './components/Sidebar';
import BottomControls from './components/BottomControls';

// Dynamically import Scene3D to avoid SSR issues with Three.js
const Scene3D = dynamic(() => import('./components/Scene3D'), {
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

export default function Home() {
  const [colors, setColors] = useState({
    body: '#ffffff',
    neck: '#ffffff',
    neckBorder: '#ffffff',
    cuff: '#ffffff',
    buttons: '#ffffff',
    ribbedHem: '#ffffff',
  });

  // Load saved design from localStorage on component mount
  useEffect(() => {
    const savedDesign = localStorage.getItem('tshirtDesign');
    if (savedDesign) {
      try {
        const designData = JSON.parse(savedDesign);
        if (designData.colors) {
          setColors(designData.colors);
        }
        // Note: For a complete implementation, you would also load placedImages
        // and apply them to a more advanced 3D model that supports textures
      } catch (error) {
        console.error('Error loading saved design:', error);
      }
    }
  }, []);

  const handleColorChange = (part: string, color: string) => {
    setColors(prev => ({
      ...prev,
      [part]: color
    }));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          className="flex-shrink-0"
          colors={colors}
          onColorChange={handleColorChange}
        />

        {/* 3D Viewer Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.location.href = '/editor'}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Edit in Editor
                </button>
                <button className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors">
                  Save Design
                </button>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* 3D Canvas Area */}
          <div className="flex-1 relative bg-gradient-to-br from-gray-100 to-gray-200">
            <Scene3D
              className="absolute inset-0"
              colors={colors}
            />
          </div>

          {/* Bottom Controls */}
          <BottomControls />
        </div>
      </div>
    </div>
  );
}
