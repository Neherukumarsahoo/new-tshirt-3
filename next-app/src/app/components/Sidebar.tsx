'use client';

import { useState } from 'react';

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

interface SidebarProps {
  className?: string;
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

export default function Sidebar({ className = '', colors, onColorChange }: SidebarProps) {
  const [activeTool, setActiveTool] = useState('edit');

  const handleColorChange = (part: string, color: string) => {
    onColorChange(part, color);
  };

  const tools = [
    { id: 'edit', label: 'Edit', icon: '✏️' },
    { id: 'background', label: 'Background', icon: '🖼️' },
    { id: 'motion', label: 'Motion', icon: '🎬' },
    { id: 'texture', label: 'Texture', icon: '🧵' },
  ];

  return (
    <div className={`w-80 bg-white border-r border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800">3D Polo Tshirt Mockup</h1>
        <p className="text-sm text-gray-600">Customizable Design Template</p>
      </div>

      {/* Tools Navigation */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTool === tool.id
                  ? 'bg-pink-100 text-pink-700 border border-pink-200'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{tool.icon}</span>
              <span className="font-medium">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tool Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTool === 'edit' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">DESIGN</h3>
              <div className="border-2 border-dashed border-pink-300 rounded-lg p-6 text-center bg-pink-50">
                <div className="mb-4">
                  <span className="text-4xl">🎨</span>
                </div>
                <button
                  onClick={() => window.location.href = '/editor'}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Upload Image ⬆
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  PNG or JPG (max. 10MB)
                </p>
              </div>
            </div>

            {/* Color Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">COLOR</h3>
              <div className="space-y-4">
                <ColorPicker
                  label="Body"
                  value={colors.body}
                  onChange={(color) => handleColorChange('body', color)}
                />
                <ColorPicker
                  label="Neck"
                  value={colors.neck}
                  onChange={(color) => handleColorChange('neck', color)}
                />
                <ColorPicker
                  label="Neck-Border"
                  value={colors.neckBorder}
                  onChange={(color) => handleColorChange('neckBorder', color)}
                />
                <ColorPicker
                  label="Cuff"
                  value={colors.cuff}
                  onChange={(color) => handleColorChange('cuff', color)}
                />
                <ColorPicker
                  label="Buttons"
                  value={colors.buttons}
                  onChange={(color) => handleColorChange('buttons', color)}
                />
                <ColorPicker
                  label="Ribbed-Hem"
                  value={colors.ribbedHem}
                  onChange={(color) => handleColorChange('ribbedHem', color)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTool === 'background' && (
          <div className="text-center text-gray-500 py-8">
            <span className="text-4xl mb-4 block">🖼️</span>
            <p>Background customization coming soon...</p>
          </div>
        )}

        {activeTool === 'motion' && (
          <div className="text-center text-gray-500 py-8">
            <span className="text-4xl mb-4 block">🎬</span>
            <p>Motion controls coming soon...</p>
          </div>
        )}

        {activeTool === 'texture' && (
          <div className="text-center text-gray-500 py-8">
            <span className="text-4xl mb-4 block">🧵</span>
            <p>Texture options coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
