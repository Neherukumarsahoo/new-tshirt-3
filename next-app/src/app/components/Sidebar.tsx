'use client';

import { useState, useRef } from 'react';

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

interface BackgroundSettings {
  type: 'color' | 'image' | 'gradient';
  color?: string;
  image?: string;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    direction?: number; // for linear gradient
  };
}

interface MotionSettings {
  autoRotate: boolean;
  rotationSpeed: number;
  rotationDirection: 'clockwise' | 'counterclockwise';
  floating: boolean;
  floatingSpeed: number;
  floatingAmplitude: number;
  cameraAnimation: boolean;
  cameraSpeed: number;
  animationPreset: 'none' | 'subtle' | 'dynamic' | 'presentation';
}

interface TextureSettings {
  fabricType: 'cotton' | 'polyester' | 'wool' | 'linen' | 'silk' | 'denim';
  finish: 'matte' | 'glossy' | 'metallic' | 'pearlescent';
  pattern: 'none' | 'subtle' | 'bold' | 'geometric' | 'floral';
  roughness: number;
  metallic: number;
  normalStrength: number;
  preset: 'none' | 'casual' | 'formal' | 'sporty' | 'luxury';
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
  background?: BackgroundSettings;
  motion?: MotionSettings;
  texture?: TextureSettings;
  onColorChange: (part: string, color: string) => void;
  onBackgroundChange?: (background: BackgroundSettings) => void;
  onMotionChange?: (motion: MotionSettings) => void;
  onTextureChange?: (texture: TextureSettings) => void;
}

export default function Sidebar({ className = '', colors, onColorChange, background, onBackgroundChange, motion, onMotionChange, texture, onTextureChange }: SidebarProps) {
  const [activeTool, setActiveTool] = useState('edit');
  const [bgSettings, setBgSettings] = useState<BackgroundSettings>(
    background || {
      type: 'color',
      color: '#f8fafc'
    }
  );
  const [motionSettings, setMotionSettings] = useState<MotionSettings>(
    motion || {
      autoRotate: false,
      rotationSpeed: 1,
      rotationDirection: 'clockwise',
      floating: false,
      floatingSpeed: 1,
      floatingAmplitude: 0.1,
      cameraAnimation: false,
      cameraSpeed: 1,
      animationPreset: 'none'
    }
  );
  const [textureSettings, setTextureSettings] = useState<TextureSettings>(
    texture || {
      fabricType: 'cotton',
      finish: 'matte',
      pattern: 'none',
      roughness: 0.5,
      metallic: 0.0,
      normalStrength: 0.5,
      preset: 'none'
    }
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textureFileInputRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (part: string, color: string) => {
    onColorChange(part, color);
  };

  const updateBackground = (newSettings: BackgroundSettings) => {
    setBgSettings(newSettings);
    onBackgroundChange?.(newSettings);
  };

  const updateTexture = (newSettings: TextureSettings) => {
    setTextureSettings(newSettings);
    onTextureChange?.(newSettings);
  };

  const handleBackgroundTypeChange = (type: 'color' | 'image' | 'gradient') => {
    if (type === 'gradient') {
      updateBackground({
        type,
        gradient: {
          type: 'linear',
          colors: ['#ffffff', '#000000'],
          direction: 0
        }
      });
    } else {
      updateBackground({ ...bgSettings, type });
    }
  };

  const handleBackgroundColorChange = (color: string) => {
    updateBackground({ ...bgSettings, color });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        updateBackground({ ...bgSettings, image: imageUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGradientColorChange = (index: number, color: string) => {
    const newColors = [...(bgSettings.gradient?.colors || ['#ffffff', '#000000'])];
    newColors[index] = color;
    updateBackground({
      ...bgSettings,
      gradient: {
        ...bgSettings.gradient,
        type: bgSettings.gradient?.type || 'linear',
        colors: newColors,
        direction: bgSettings.gradient?.direction || 0
      }
    });
  };

  const addGradientColor = () => {
    if (bgSettings.gradient && bgSettings.gradient.colors?.length < 5) {
      const newColors = [...(bgSettings.gradient.colors || []), '#ffffff'];
      updateBackground({
        ...bgSettings,
        gradient: {
          type: bgSettings.gradient.type || 'linear',
          colors: newColors,
          direction: bgSettings.gradient.direction || 0
        }
      });
    }
  };

  const removeGradientColor = (index: number) => {
    if (bgSettings.gradient && bgSettings.gradient.colors && bgSettings.gradient.colors.length > 2) {
      const newColors = bgSettings.gradient.colors.filter((_, i) => i !== index);
      updateBackground({
        ...bgSettings,
        gradient: {
          type: bgSettings.gradient.type || 'linear',
          colors: newColors,
          direction: bgSettings.gradient.direction || 0
        }
      });
    }
  };

  // Texture Functions
  const handleTexturePresetChange = (preset: TextureSettings['preset']) => {
    const presetSettings: Record<TextureSettings['preset'], Partial<TextureSettings>> = {
      none: {
        fabricType: 'cotton',
        finish: 'matte',
        pattern: 'none',
        roughness: 0.5,
        metallic: 0.0,
        normalStrength: 0.5,
        preset: 'none'
      },
      casual: {
        fabricType: 'cotton',
        finish: 'matte',
        pattern: 'subtle',
        roughness: 0.6,
        metallic: 0.0,
        normalStrength: 0.3,
        preset: 'casual'
      },
      formal: {
        fabricType: 'polyester',
        finish: 'glossy',
        pattern: 'none',
        roughness: 0.2,
        metallic: 0.1,
        normalStrength: 0.2,
        preset: 'formal'
      },
      sporty: {
        fabricType: 'polyester',
        finish: 'matte',
        pattern: 'bold',
        roughness: 0.4,
        metallic: 0.0,
        normalStrength: 0.6,
        preset: 'sporty'
      },
      luxury: {
        fabricType: 'silk',
        finish: 'pearlescent',
        pattern: 'subtle',
        roughness: 0.1,
        metallic: 0.3,
        normalStrength: 0.4,
        preset: 'luxury'
      }
    };

    updateTexture({ ...textureSettings, ...presetSettings[preset] });
  };

  const handleFabricTypeChange = (fabricType: TextureSettings['fabricType']) => {
    updateTexture({ ...textureSettings, fabricType });
  };

  const handleFinishChange = (finish: TextureSettings['finish']) => {
    updateTexture({ ...textureSettings, finish });
  };

  const handlePatternChange = (pattern: TextureSettings['pattern']) => {
    updateTexture({ ...textureSettings, pattern });
  };

  const handleRoughnessChange = (roughness: number) => {
    updateTexture({ ...textureSettings, roughness });
  };

  const handleMetallicChange = (metallic: number) => {
    updateTexture({ ...textureSettings, metallic });
  };

  const handleNormalStrengthChange = (normalStrength: number) => {
    updateTexture({ ...textureSettings, normalStrength });
  };

  const handleLoadCustomTexture = () => {
    textureFileInputRef.current?.click();
  };

  const handleCustomTextureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const textureUrl = e.target?.result as string;
        // Here you would typically upload to a texture URL or process the texture
        console.log('Custom texture loaded:', textureUrl);
        alert('Custom texture loaded! (In a real app, this would be applied to the 3D model)');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePattern = () => {
    alert('Pattern creator opened! (In a real app, this would open a pattern design tool)');
  };

  const handleResetTexture = () => {
    updateTexture({
      fabricType: 'cotton',
      finish: 'matte',
      pattern: 'none',
      roughness: 0.5,
      metallic: 0.0,
      normalStrength: 0.5,
      preset: 'none'
    });
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTool === tool.id
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
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">BACKGROUND TYPE</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: 'color' as const, label: 'Color', icon: '🎨' },
                  { type: 'image' as const, label: 'Image', icon: '🖼️' },
                  { type: 'gradient' as const, label: 'Gradient', icon: '🌈' }
                ].map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handleBackgroundTypeChange(option.type)}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${bgSettings.type === option.type
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {bgSettings.type === 'color' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">BACKGROUND COLOR</h3>
                <div className="space-y-4">
                  <ColorPicker
                    label="Background Color"
                    value={bgSettings.color || '#f8fafc'}
                    onChange={handleBackgroundColorChange}
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {['#f8fafc', '#ffffff', '#000000', '#f1f5f9'].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleBackgroundColorChange(color)}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${bgSettings.color === color
                          ? 'border-pink-500 scale-110'
                          : 'border-gray-300 hover:scale-105'
                          }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {bgSettings.type === 'image' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">BACKGROUND IMAGE</h3>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="mb-4">
                      <span className="text-4xl">📸</span>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Upload Background Image
                    </button>
                    <p className="text-sm text-gray-600 mt-2">
                      PNG, JPG or JPEG (max. 10MB)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <input
                    ref={textureFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomTextureUpload}
                    className="hidden"
                  />
                  {bgSettings.image && (
                    <div className="relative">
                      <img
                        src={bgSettings.image}
                        alt="Background preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => updateBackground({ ...bgSettings, image: undefined })}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {bgSettings.type === 'gradient' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">GRADIENT BACKGROUND</h3>
                <div className="space-y-4">
                  {/* Gradient Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gradient Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { type: 'linear' as const, label: 'Linear' },
                        { type: 'radial' as const, label: 'Radial' }
                      ].map((option) => (
                        <button
                          key={option.type}
                          onClick={() => updateBackground({
                            ...bgSettings,
                            gradient: {
                              type: option.type,
                              colors: bgSettings.gradient?.colors || ['#ffffff', '#000000'],
                              direction: bgSettings.gradient?.direction || 0
                            }
                          })}
                          className={`p-2 rounded-lg border transition-colors ${bgSettings.gradient?.type === option.type
                            ? 'border-pink-500 bg-pink-50 text-pink-700'
                            : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gradient Colors */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Colors
                      </label>
                      <button
                        onClick={addGradientColor}
                        disabled={(bgSettings.gradient?.colors?.length || 0) >= 5}
                        className="text-pink-500 hover:text-pink-600 text-sm disabled:opacity-50"
                      >
                        + Add Color
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(bgSettings.gradient?.colors || ['#ffffff', '#000000']).map((color, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <ColorPicker
                            label={`Color ${index + 1}`}
                            value={color}
                            onChange={(newColor) => handleGradientColorChange(index, newColor)}
                          />
                          {bgSettings.gradient && bgSettings.gradient.colors.length > 2 && (
                            <button
                              onClick={() => removeGradientColor(index)}
                              className="text-red-500 hover:text-red-600 p-1"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gradient Direction (Linear only) */}
                  {bgSettings.gradient?.type === 'linear' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Direction: {bgSettings.gradient.direction || 0}°
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={bgSettings.gradient.direction || 0}
                        onChange={(e) => updateBackground({
                          ...bgSettings,
                          gradient: {
                            ...bgSettings.gradient,
                            direction: parseInt(e.target.value)
                          }
                        })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0°</span>
                        <span>90°</span>
                        <span>180°</span>
                        <span>270°</span>
                        <span>360°</span>
                      </div>
                    </div>
                  )}

                  {/* Gradient Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview
                    </label>
                    <div
                      className="w-full h-16 rounded-lg border"
                      style={{
                        background: bgSettings.gradient?.type === 'linear'
                          ? `linear-gradient(${bgSettings.gradient.direction || 0}deg, ${bgSettings.gradient.colors.join(', ')})`
                          : `radial-gradient(circle, ${bgSettings.gradient.colors.join(', ')})`
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTool === 'motion' && (
          <div className="space-y-6">
            {/* Animation Presets */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ANIMATION PRESETS</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { preset: 'none' as const, label: 'None', icon: '⏹️', description: 'No animation' },
                  { preset: 'subtle' as const, label: 'Subtle', icon: '🌊', description: 'Gentle movement' },
                  { preset: 'dynamic' as const, label: 'Dynamic', icon: '⚡', description: 'Energetic motion' },
                  { preset: 'presentation' as const, label: 'Presentation', icon: '🎭', description: 'Showcase mode' }
                ].map((option) => (
                  <button
                    key={option.preset}
                    onClick={() => {
                      const presetSettings = {
                        none: {
                          autoRotate: false,
                          rotationSpeed: 0,
                          floating: false,
                          floatingSpeed: 0,
                          cameraAnimation: false,
                          cameraSpeed: 0,
                          animationPreset: 'none' as const
                        },
                        subtle: {
                          autoRotate: true,
                          rotationSpeed: 0.5,
                          rotationDirection: 'clockwise' as const,
                          floating: true,
                          floatingSpeed: 0.8,
                          floatingAmplitude: 0.05,
                          cameraAnimation: false,
                          cameraSpeed: 0.3,
                          animationPreset: 'subtle' as const
                        },
                        dynamic: {
                          autoRotate: true,
                          rotationSpeed: 1.5,
                          rotationDirection: 'clockwise' as const,
                          floating: true,
                          floatingSpeed: 1.2,
                          floatingAmplitude: 0.1,
                          cameraAnimation: true,
                          cameraSpeed: 0.8,
                          animationPreset: 'dynamic' as const
                        },
                        presentation: {
                          autoRotate: true,
                          rotationSpeed: 0.8,
                          rotationDirection: 'clockwise' as const,
                          floating: true,
                          floatingSpeed: 0.6,
                          floatingAmplitude: 0.08,
                          cameraAnimation: true,
                          cameraSpeed: 0.5,
                          animationPreset: 'presentation' as const
                        }
                      };
                      setMotionSettings(prev => ({ ...prev, ...presetSettings[option.preset] }));
                      onMotionChange?.({ ...motionSettings, ...presetSettings[option.preset] });
                    }}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${motionSettings.animationPreset === option.preset
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Rotation */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">AUTO ROTATION</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Enable Rotation</label>
                  <button
                    onClick={() => {
                      const newSettings = { ...motionSettings, autoRotate: !motionSettings.autoRotate };
                      setMotionSettings(newSettings);
                      onMotionChange?.(newSettings);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${motionSettings.autoRotate ? 'bg-pink-500' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${motionSettings.autoRotate ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {motionSettings.autoRotate && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Speed: {motionSettings.rotationSpeed.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        value={motionSettings.rotationSpeed}
                        onChange={(e) => {
                          const newSettings = { ...motionSettings, rotationSpeed: parseFloat(e.target.value) };
                          setMotionSettings(newSettings);
                          onMotionChange?.(newSettings);
                        }}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { direction: 'clockwise' as const, label: 'Clockwise', icon: '↻' },
                          { direction: 'counterclockwise' as const, label: 'Counter-Clockwise', icon: '↺' }
                        ].map((option) => (
                          <button
                            key={option.direction}
                            onClick={() => {
                              const newSettings = { ...motionSettings, rotationDirection: option.direction };
                              setMotionSettings(newSettings);
                              onMotionChange?.(newSettings);
                            }}
                            className={`p-2 rounded-lg border transition-colors ${motionSettings.rotationDirection === option.direction
                              ? 'border-pink-500 bg-pink-50 text-pink-700'
                              : 'border-gray-300 hover:border-gray-400'
                              }`}
                          >
                            <span className="mr-2">{option.icon}</span>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Floating Animation */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">FLOATING MOTION</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Enable Floating</label>
                  <button
                    onClick={() => {
                      const newSettings = { ...motionSettings, floating: !motionSettings.floating };
                      setMotionSettings(newSettings);
                      onMotionChange?.(newSettings);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${motionSettings.floating ? 'bg-pink-500' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${motionSettings.floating ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {motionSettings.floating && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Speed: {motionSettings.floatingSpeed.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={motionSettings.floatingSpeed}
                        onChange={(e) => {
                          const newSettings = { ...motionSettings, floatingSpeed: parseFloat(e.target.value) };
                          setMotionSettings(newSettings);
                          onMotionChange?.(newSettings);
                        }}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amplitude: {motionSettings.floatingAmplitude.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0.01"
                        max="0.2"
                        step="0.01"
                        value={motionSettings.floatingAmplitude}
                        onChange={(e) => {
                          const newSettings = { ...motionSettings, floatingAmplitude: parseFloat(e.target.value) };
                          setMotionSettings(newSettings);
                          onMotionChange?.(newSettings);
                        }}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Camera Animation */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">CAMERA ANIMATION</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Enable Camera Animation</label>
                  <button
                    onClick={() => {
                      const newSettings = { ...motionSettings, cameraAnimation: !motionSettings.cameraAnimation };
                      setMotionSettings(newSettings);
                      onMotionChange?.(newSettings);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${motionSettings.cameraAnimation ? 'bg-pink-500' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${motionSettings.cameraAnimation ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {motionSettings.cameraAnimation && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Camera Speed: {motionSettings.cameraSpeed.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="2"
                      step="0.1"
                      value={motionSettings.cameraSpeed}
                      onChange={(e) => {
                        const newSettings = { ...motionSettings, cameraSpeed: parseFloat(e.target.value) };
                        setMotionSettings(newSettings);
                        onMotionChange?.(newSettings);
                      }}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>


          </div>
        )}

        {activeTool === 'texture' && (
          <div className="space-y-6">
            {/* Texture Presets */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">TEXTURE PRESETS</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { preset: 'none' as const, label: 'Basic', icon: '⚪', description: 'Clean & simple' },
                  { preset: 'casual' as const, label: 'Casual', icon: '👕', description: 'Everyday wear' },
                  { preset: 'formal' as const, label: 'Formal', icon: '🤵', description: 'Professional look' },
                  { preset: 'sporty' as const, label: 'Sporty', icon: '🏃', description: 'Athletic style' },
                  { preset: 'luxury' as const, label: 'Luxury', icon: '💎', description: 'Premium finish' }
                ].map((option) => (
                  <button
                    key={option.preset}
                    onClick={() => handleTexturePresetChange(option.preset)}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${textureSettings.preset === option.preset
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fabric Type */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">FABRIC TYPE</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'cotton' as const, label: 'Cotton', icon: '🌿' },
                  { type: 'polyester' as const, label: 'Polyester', icon: '🧵' },
                  { type: 'wool' as const, label: 'Wool', icon: '🐑' },
                  { type: 'linen' as const, label: 'Linen', icon: '🌾' },
                  { type: 'silk' as const, label: 'Silk', icon: '🦋' },
                  { type: 'denim' as const, label: 'Denim', icon: '👖' }
                ].map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handleFabricTypeChange(option.type)}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${textureSettings.fabricType === option.type
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-xl mb-1">{option.icon}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Material Finish */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">MATERIAL FINISH</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { finish: 'matte' as const, label: 'Matte', icon: '🖤', description: 'Non-reflective' },
                  { finish: 'glossy' as const, label: 'Glossy', icon: '✨', description: 'Shiny surface' },
                  { finish: 'metallic' as const, label: 'Metallic', icon: '🔗', description: 'Metal-like' },
                  { finish: 'pearlescent' as const, label: 'Pearlescent', icon: '🦪', description: 'Pearl shine' }
                ].map((option) => (
                  <button
                    key={option.finish}
                    onClick={() => handleFinishChange(option.finish)}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${textureSettings.finish === option.finish
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-xl mb-1">{option.icon}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Surface Pattern */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">SURFACE PATTERN</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { pattern: 'none' as const, label: 'Smooth', icon: '⚪' },
                  { pattern: 'subtle' as const, label: 'Subtle', icon: '👁️' },
                  { pattern: 'bold' as const, label: 'Bold', icon: '🎯' },
                  { pattern: 'geometric' as const, label: 'Geometric', icon: '📐' },
                  { pattern: 'floral' as const, label: 'Floral', icon: '🌸' }
                ].map((option) => (
                  <button
                    key={option.pattern}
                    onClick={() => handlePatternChange(option.pattern)}
                    className={`p-2 rounded-lg border-2 text-center transition-colors ${textureSettings.pattern === option.pattern
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-lg mb-1">{option.icon}</div>
                    <div className="text-xs font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Material Properties */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">MATERIAL PROPERTIES</h3>
              <div className="space-y-4">
                {/* Roughness */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Roughness</label>
                    <span className="text-sm text-gray-500">{textureSettings.roughness.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={textureSettings.roughness}
                    onChange={(e) => handleRoughnessChange(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Smooth</span>
                    <span>Rough</span>
                  </div>
                </div>

                {/* Metallic */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Metallic</label>
                    <span className="text-sm text-gray-500">{textureSettings.metallic.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={textureSettings.metallic}
                    onChange={(e) => handleMetallicChange(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Plastic</span>
                    <span>Metal</span>
                  </div>
                </div>

                {/* Normal Strength */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Bump Strength</label>
                    <span className="text-sm text-gray-500">{textureSettings.normalStrength.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={textureSettings.normalStrength}
                    onChange={(e) => handleNormalStrengthChange(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Flat</span>
                    <span>Textured</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Texture Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">TEXTURE PREVIEW</h3>
              <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="w-full h-24 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-2">👕</div>
                    <div className="text-sm text-gray-600">Texture Preview</div>
                    <div className="text-xs text-gray-500 mt-1">Cotton • Matte • Smooth</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ADVANCED</h3>
              <div className="space-y-3">
                <button
                  onClick={handleLoadCustomTexture}
                  className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  📁 Load Custom Texture
                </button>
                <button
                  onClick={handleCreatePattern}
                  className="w-full p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  🎨 Create Pattern
                </button>
                <button
                  onClick={handleResetTexture}
                  className="w-full p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                >
                  🔄 Reset to Default
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
