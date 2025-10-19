'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface TextureTransform {
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}

interface UVTextureData {
  region: 'front' | 'back' | 'leftSleeve' | 'rightSleeve';
  textureUrl: string;
  width: number;
  height: number;
}

interface TShirtModelProps {
  modelPath?: string;
  colors: {
    body: string;
    neck: string;
    neckBorder: string;
    cuff: string;
    buttons: string;
    ribbedHem: string;
  };
  textures?: {
    front?: string;
    back?: string;
    leftSleeve?: string;
    rightSleeve?: string;
  };
  uvTextures?: {
    front?: UVTextureData;
    back?: UVTextureData;
    leftSleeve?: UVTextureData;
    rightSleeve?: UVTextureData;
  };
  textureTransforms?: {
    front?: TextureTransform;
    back?: TextureTransform;
    leftSleeve?: TextureTransform;
    rightSleeve?: TextureTransform;
  };
}

function TShirtModel({ modelPath = '/poloshirt2.glb', colors, textures, uvTextures, textureTransforms }: TShirtModelProps) {
  const { scene } = useGLTF(modelPath);
  console.log('🔍 Loaded model path:', modelPath);
  console.log('🔍 Scene object:', scene);
  console.log('🔍 Scene children count:', scene.children.length);
  scene.traverse((child) => {
    console.log('🔍 Model child:', child.name, child.type);
  });

  // Log textures every render
  React.useEffect(() => {
    console.log('🔍 Scene3D textures prop:', textures);
    console.log('🔍 Scene3D transforms prop:', textureTransforms);
  }, [textures, textureTransforms]);
  const modelRef = useRef<THREE.Group>(null);
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);

  // Create materials based on colors and textures
  const materials = useMemo(() => {
    const createMaterial = (color: string, textureUrl?: string) => {
      const material = new THREE.MeshLambertMaterial({
        color: new THREE.Color(color),
      });

      if (textureUrl) {
        try {
          const texture = textureLoader.load(textureUrl);
          texture.flipY = false; // Prevent texture flipping for webgl
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;

          // Improve texture filtering for better quality
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;

          // Generate mipmaps for better quality at different scales
          texture.generateMipmaps = true;

          material.map = texture;
          material.needsUpdate = true;
        } catch (error) {
          console.warn('Failed to load texture:', error);
        }
      }

      return material;
    };

    return {
      body: createMaterial(colors.body, undefined), // No texture on base body - only apply textures to specific parts
      neck: createMaterial(colors.neck),
      neckBorder: createMaterial(colors.neckBorder),
      cuff: createMaterial(colors.cuff),
      buttons: createMaterial(colors.buttons),
      ribbedHem: createMaterial(colors.ribbedHem),
    };
  }, [colors, textures, textureLoader]);

  // Apply materials to model parts
  useEffect(() => {
    if (!modelRef.current) return;

    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const meshName = child.name.toLowerCase();

        // Debug: Log all mesh names
        console.log('Found mesh:', child.name, '(lowercase:', meshName + ')');

        // Special handling for design mesh - always make it transparent
        if (child.name.toLowerCase() === 'design') {
          child.material = new THREE.MeshLambertMaterial({
            transparent: true,
            opacity: 0,
            visible: false,
          });
          console.log('🔥 Made design mesh transparent');
          return;
        }

        // Apply texture to BODY mesh only
        if (child.name.toLowerCase() === 'body') {
          let textureUrl = null;
          let transforms = null;

          // Priority order: front > back > leftSleeve > rightSleeve
          if (textures?.front) {
            textureUrl = textures.front;
            transforms = textureTransforms?.front;
            console.log('🔥 Applying FRONT texture to body');
          } else if (textures?.back) {
            textureUrl = textures.back;
            transforms = textureTransforms?.back;
            console.log('🔥 Applying BACK texture to body');
          } else if (textures?.leftSleeve) {
            textureUrl = textures.leftSleeve;
            transforms = textureTransforms?.leftSleeve;
            console.log('🔥 Applying LEFT SLEEVE texture to body');
          } else if (textures?.rightSleeve) {
            textureUrl = textures.rightSleeve;
            transforms = textureTransforms?.rightSleeve;
            console.log('🔥 Applying RIGHT SLEEVE texture to body');
          }

          if (textureUrl) {
            const texture = textureLoader.load(
              textureUrl,
              () => console.log('✅ Container texture loaded:', textureUrl),
              undefined,
              (err) => console.error('❌ Container texture failed:', err)
            );

            // Apply transforms if available
            if (transforms) {
              texture.center.set(0.5, 0.5);
              texture.rotation = (transforms.rotation * Math.PI) / 180;

              const scaleX = Math.max(0.1, transforms.scale / 220);
              const scaleY = Math.max(0.1, transforms.scale / 220);
              texture.repeat.set(scaleX, scaleY);

              const offsetX = transforms.position.x / 800;
              const offsetY = -transforms.position.y / 800;
              texture.offset.set(offsetX, offsetY);
            } else {
              // Default visible settings
              texture.repeat.set(0.8, 0.8);
              texture.offset.set(0.1, 0.1);
              texture.center.set(0.5, 0.5);
            }

            child.material = new THREE.MeshLambertMaterial({
              map: texture,
              transparent: true,
            });

            console.log('✅ Applied container-specific texture to body mesh');
            child.material.needsUpdate = true;
          } else {
            // No texture - apply base material
            child.material = materials.body;
          }
          return;
        }

        // Apply materials to other parts (neck, cuff, buttons, etc.)
        if (meshName.includes('neck') && !meshName.includes('border')) {
          child.material = materials.neck;
        } else if (meshName.includes('neck') && meshName.includes('border')) {
          child.material = materials.neckBorder;
        } else if (meshName.includes('cuff')) {
          child.material = materials.cuff;
        } else if (meshName.includes('button')) {
          child.material = materials.buttons;
        } else if (meshName.includes('ribbed') || meshName.includes('hem')) {
          child.material = materials.ribbedHem;
        } else {
          // Default body material for any other parts
          child.material = materials.body;
        }
      }
    });
  }, [materials, textures, textureTransforms, textureLoader, colors]);

  return (
    <group ref={modelRef}>
      <primitive object={scene} scale={[1.3, 1.3, 1.3]} position={[0, -0.6, 0]} />
    </group>
  );
}

function SceneContent({ colors, textures, uvTextures, textureTransforms }: { colors: TShirtModelProps['colors'], textures?: TShirtModelProps['textures'], uvTextures?: TShirtModelProps['uvTextures'], textureTransforms?: TShirtModelProps['textureTransforms'] }) {
  return (
    <>
      {/* Enhanced lighting setup for better 3D appearance */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight
        position={[-5, 3, 2]}
        intensity={0.8}
      />
      <pointLight position={[0, 2, 3]} intensity={0.5} />

      {/* Background environment */}
      <color attach="background" args={['#f8fafc']} />

      {/* Ground plane for better depth perception */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial transparent opacity={0.1} />
      </mesh>

      <TShirtModel colors={colors} textures={textures} uvTextures={uvTextures} textureTransforms={textureTransforms} />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={8}
        maxPolarAngle={Math.PI * 0.8}
        minPolarAngle={Math.PI * 0.2}
        autoRotate={false}
        dampingFactor={0.05}
        enableDamping={true}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="text-gray-500">Loading 3D Scene...</div>
    </div>
  );
}

interface Scene3DProps {
  className?: string;
  colors: {
    body: string;
    neck: string;
    neckBorder: string;
    cuff: string;
    buttons: string;
    ribbedHem: string;
  };
  textures?: {
    front?: string;
    back?: string;
    leftSleeve?: string;
    rightSleeve?: string;
  };
  uvTextures?: {
    front?: UVTextureData;
    back?: UVTextureData;
    leftSleeve?: UVTextureData;
    rightSleeve?: UVTextureData;
  };
  textureTransforms?: {
    front?: TextureTransform;
    back?: TextureTransform;
    leftSleeve?: TextureTransform;
    rightSleeve?: TextureTransform;
  };
}

export default function Scene3D({ className = '', colors, textures, uvTextures, textureTransforms }: Scene3DProps) {
  // 🔥 ULTIMATE TEST: Log received props immediately
  console.log('🔥 RECEIVED PROPS:', { textures, textureTransforms });

  const [contextLost, setContextLost] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setContextLost(true);
      console.warn('WebGL context lost');
    };

    const handleContextRestored = () => {
      setContextLost(false);
      console.log('WebGL context restored');
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, []);

  const handleRetry = () => {
    setContextLost(false);
    // Force a re-render by updating a state that affects the Canvas
    window.location.reload();
  };

  if (contextLost) {
    return (
      <div className={`w-full h-full ${className} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-red-500 mb-4">WebGL Context Lost</div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className} relative`}>
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0, 6.5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Suspense fallback={null}>
          <SceneContent colors={colors} textures={textures} uvTextures={uvTextures} textureTransforms={textureTransforms} />
        </Suspense>
      </Canvas>

      {/* 3D interaction hints */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-xs text-gray-600 mb-2">3D Controls</div>
        <div className="flex flex-col gap-1 text-xs text-gray-500">
          <div>🖱️ Drag to rotate</div>
          <div>⚡ Scroll to zoom</div>
          <div>✋ Right-click to pan</div>
        </div>
      </div>
    </div>
  );
}
