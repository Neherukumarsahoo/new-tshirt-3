'use client';

import { useState, useRef } from 'react';

interface LeftSidebarProps {
  className?: string;
  onImageUpload: (files: File[]) => void;
  uploadedImages: File[];
  cropImage: File | null;
  onPlaceOnSection: (section: 'front' | 'back' | 'leftSleeve' | 'rightSleeve') => void;
  onReturnToMain: () => void;
}

export default function LeftSidebar({
  className = '',
  onImageUpload,
  uploadedImages,
  cropImage,
  onPlaceOnSection,
  onReturnToMain
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'layers'>('editor');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onImageUpload(files);
    }
  };

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-800">Editor</h1>
          <button
            onClick={() => setActiveTab(activeTab === 'editor' ? 'layers' : 'editor')}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'editor'
              ? 'bg-pink-100 text-pink-700 border border-pink-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab('layers')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'layers'
              ? 'bg-pink-100 text-pink-700 border border-pink-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
          >
            Layers
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'editor' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">ADD IMAGES</h3>
              <div
                onClick={handleAddImageClick}
                className="border-2 border-dashed border-pink-300 rounded-lg p-6 text-center bg-pink-50 cursor-pointer hover:bg-pink-100 transition-colors"
              >
                <div className="mb-4">
                  <span className="text-3xl">⬆️</span>
                </div>
                <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Add Images
                </button>
                <p className="text-xs text-gray-600 mt-2">
                  PNG or JPG (max. 10MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Uploaded Images */}
            {uploadedImages.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">UPLOADED IMAGES</h3>
                <div className="space-y-3">
                  {uploadedImages.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Crop Interface */}
            {cropImage && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">PLACE IMAGE</h3>
                <div className="space-y-3">
                  <div className="relative bg-gray-100 rounded-lg p-3">
                    <img
                      src={URL.createObjectURL(cropImage)}
                      alt="Current image"
                      className="w-full h-32 object-contain rounded"
                    />
                  </div>

                  {/* Placement Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onPlaceOnSection('front')}
                      className="py-2 px-3 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    >
                      Place on Front
                    </button>
                    <button
                      onClick={() => onPlaceOnSection('back')}
                      className="py-2 px-3 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    >
                      Place on Back
                    </button>
                    <button
                      onClick={() => onPlaceOnSection('leftSleeve')}
                      className="py-2 px-3 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                    >
                      Left Sleeve
                    </button>
                    <button
                      onClick={() => onPlaceOnSection('rightSleeve')}
                      className="py-2 px-3 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                    >
                      Right Sleeve
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Return Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={onReturnToMain}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Return to Main
              </button>
            </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="text-center text-gray-500 py-8">
            <span className="text-4xl mb-4 block">📚</span>
            <p>Layer management coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
