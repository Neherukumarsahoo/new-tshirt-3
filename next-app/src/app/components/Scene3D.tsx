'use client';

import React, { Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
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

function TShirtModel({ modelPath = '/poloshirt3.glb', colors, textures, uvTextures, textureTransforms, scale }: TShirtModelProps & { scale?: number }) {
  const { scene } = useGLTF(modelPath);
  const { invalidate } = useThree(); // Get invalidate function to force re-render
  const modelRef = useRef<THREE.Group>(null);
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  const [materialUpdateTrigger, setMaterialUpdateTrigger] = useState(0); // Force re-render trigger
  const [textureLoadCount, setTextureLoadCount] = useState(0); // Track texture loading

  console.log('🔍 Loaded model path:', modelPath);
  console.log('🔍 Scene object:', scene);
  console.log('🔍 Scene children count:', scene.children.length);
  scene.traverse((child) => {
    console.log('🔍 Model child:', child.name, child.type);
  });

  // 🔥 NEW: Apply textures to SEPARATE meshes (front, back, leftSleeve, rightSleeve)
  useEffect(() => {
    if (!modelRef.current) return;

    console.log('🔥 useEffect triggered with textures:', textures);

    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const meshName = child.name.toLowerCase();
        console.log('🔥 Processing mesh:', child.name);

        // Skip design mesh
        if (meshName === 'design') {
          child.material = new THREE.MeshLambertMaterial({
            transparent: true,
            opacity: 0,
            visible: false,
          });
          console.log('🔥 Made design mesh transparent');
          return;
        }

        // 🚀 NEW LOGIC: Apply texture to SPECIFIC mesh based on mesh name
        let textureUrl = null;
        let transforms = null;

        // Match mesh name to texture
        if (meshName === 'front' && textures?.front) {
          textureUrl = textures.front;
          transforms = textureTransforms?.front;
          console.log('🔥 Applying FRONT texture to FRONT mesh:', textureUrl);
        } else if (meshName === 'back' && textures?.back) {
          textureUrl = textures.back;
          transforms = textureTransforms?.back;
          console.log('🔥 Applying BACK texture to BACK mesh:', textureUrl);
        } else if (meshName === 'leftsleeve' && textures?.leftSleeve) {
          textureUrl = textures.leftSleeve;
          transforms = textureTransforms?.leftSleeve;
          console.log('🔥 Applying LEFT SLEEVE texture to LEFTSLEEVE mesh:', textureUrl);
        } else if (meshName === 'rightsleeve' && textures?.rightSleeve) {
          textureUrl = textures.rightSleeve;
          transforms = textureTransforms?.rightSleeve;
          console.log('🔥 Applying RIGHT SLEEVE texture to RIGHTSLEEVE mesh:', textureUrl);
        }

        if (textureUrl) {
          const texture = textureLoader.load(
            textureUrl,
            () => console.log('✅ Texture loaded successfully on', child.name, ':', textureUrl),
            undefined,
            (err) => console.error('❌ Texture failed on', child.name, ':', err)
          );

          // Set texture properties
          texture.flipY = false;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;

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
            // Default settings
            texture.repeat.set(1, 1);
            texture.offset.set(0, 0);
            texture.center.set(0.5, 0.5);
            texture.rotation = 0;
          }

          // Apply textured material to this specific mesh
          child.material = new THREE.MeshLambertMaterial({
            map: texture,
            transparent: true,
          });

          console.log('✅ Applied texture to', child.name, 'mesh');
          child.material.needsUpdate = true;
        } else {
          // No texture for this mesh - apply base color material
          if (meshName.includes('neck') && !meshName.includes('border')) {
            child.material = new THREE.MeshLambertMaterial({ color: new THREE.Color(colors.neck) });
          } else if (meshName.includes('neck') && meshName.includes('border')) {
            child.material = new THREE.MeshLambertMaterial({ color: new THREE.Color(colors.neckBorder) });
          } else if (meshName.includes('cuff')) {
            child.material = new THREE.MeshLambertMaterial({ color: new THREE.Color(colors.cuff) });
          } else if (meshName.includes('button')) {
            child.material = new THREE.MeshLambertMaterial({ color: new THREE.Color(colors.buttons) });
          } else if (meshName.includes('ribbed') || meshName.includes('hem')) {
            child.material = new THREE.MeshLambertMaterial({ color: new THREE.Color(colors.ribbedHem) });
          } else {
            // Default body color for unmatched meshes
            child.material = new THREE.MeshLambertMaterial({ color: new THREE.Color(colors.body) });
          }
          console.log('🔥 Applied base material to', child.name);
        }
      }
    });
  }, [modelRef, textures, textureTransforms, textureLoader, colors]);

  return (
    <group ref={modelRef}>
      <primitive object={scene} scale={[1.3 * (scale || 1), 1.3 * (scale || 1), 1.3 * (scale || 1)]} position={[0, -0.6, 0]} />
    </group>
  );
}

function BackgroundElement({ background }: { background?: BackgroundSettings }) {
  const { scene } = useThree();
  const backgroundRef = useRef<THREE.Mesh>(null);
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);

  useEffect(() => {
    if (!backgroundRef.current || !background) return;

    let material: THREE.Material;

    switch (background.type) {
      case 'color':
        material = new THREE.MeshBasicMaterial({
          color: background.color || '#f8fafc',
          side: THREE.BackSide
        });
        break;

      case 'image':
        if (background.image) {
          const texture = textureLoader.load(background.image);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide
          });
        } else {
          material = new THREE.MeshBasicMaterial({
            color: '#f8fafc',
            side: THREE.BackSide
          });
        }
        break;

      case 'gradient':
        {
          // Use a safe local fallback for gradient data so TypeScript can't complain about undefined
          const gradientDef = background.gradient ?? { type: 'linear', colors: ['#f8fafc'], direction: 0 };

          // Create canvas for gradient texture
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d')!;

          const colorsArr = gradientDef.colors && gradientDef.colors.length ? gradientDef.colors : ['#f8fafc'];

          if (gradientDef.type === 'linear') {
            const angle = (gradientDef.direction || 0) * Math.PI / 180;
            const gradient = ctx.createLinearGradient(
              0, 0,
              Math.cos(angle) * 512,
              Math.sin(angle) * 512
            );
            colorsArr.forEach((color, index) => {
              const stop = colorsArr.length > 1 ? index / (colorsArr.length - 1) : 0;
              gradient.addColorStop(stop, color);
            });
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 512, 512);
          } else {
            const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
            colorsArr.forEach((color, index) => {
              const stop = colorsArr.length > 1 ? index / (colorsArr.length - 1) : 0;
              gradient.addColorStop(stop, color);
            });
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 512, 512);
          }

          const gradientTexture = new THREE.CanvasTexture(canvas);
          material = new THREE.MeshBasicMaterial({
            map: gradientTexture,
            side: THREE.BackSide
          });
        }
        break;

      default:
        material = new THREE.MeshBasicMaterial({
          color: '#f8fafc',
          side: THREE.BackSide
        });
    }

    backgroundRef.current.material = material;
  }, [background, textureLoader]);

  return (
    <mesh ref={backgroundRef} position={[0, 0, -5]}>
      <sphereGeometry args={[10, 32, 32]} />
    </mesh>
  );
}

function AnimatedTShirt({ colors, textures, uvTextures, textureTransforms, motion, scale }: {
  colors: TShirtModelProps['colors'],
  textures?: TShirtModelProps['textures'],
  uvTextures?: TShirtModelProps['uvTextures'],
  textureTransforms?: TShirtModelProps['textureTransforms'],
  motion?: MotionSettings,
  scale?: number
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Debug motion props
  useEffect(() => {
    console.log('🎬 AnimatedTShirt received motion:', motion);
  }, [motion]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();

    // Auto rotation - only if enabled
    if (motion?.autoRotate) {
      const rotationSpeed = motion.rotationSpeed * 0.01; // Increased for visibility
      const direction = motion.rotationDirection === 'clockwise' ? 1 : -1;
      groupRef.current.rotation.y += rotationSpeed * direction;
      console.log('🔄 Rotating:', { speed: rotationSpeed, direction, currentRotation: groupRef.current.rotation.y });
    }

    // Floating animation - only if enabled
    if (motion?.floating) {
      const floatingSpeed = motion.floatingSpeed * 0.03;
      const floatingAmplitude = motion.floatingAmplitude;
      groupRef.current.position.y = Math.sin(time * floatingSpeed) * floatingAmplitude;
      console.log('🌊 Floating:', { time, floatingSpeed, amplitude: floatingAmplitude, positionY: groupRef.current.position.y });
    }
  });

  return (
    <group ref={groupRef}>
      <TShirtModel colors={colors} textures={textures} uvTextures={uvTextures} textureTransforms={textureTransforms} scale={scale} />
    </group>
  );
}

function AnimatedCamera({ motion }: { motion?: MotionSettings }) {
  const { camera } = useThree();
  const initialPosition = useRef(new THREE.Vector3());
  const initialLookAt = useRef(new THREE.Vector3());

  // Debug motion props
  useEffect(() => {
    console.log('📷 AnimatedCamera received motion:', motion);
  }, [motion]);

  useEffect(() => {
    if (camera) {
      initialPosition.current.copy(camera.position);
      initialLookAt.current.set(0, 0, 0); // Looking at the center
    }
  }, [camera]);

  useFrame((state) => {
    if (!motion?.cameraAnimation || !camera) return;

    const time = state.clock.getElapsedTime();
    const radius = 8;
    const speed = motion.cameraSpeed * 0.5; // Increased for visibility

    // Circular camera movement
    camera.position.x = Math.cos(time * speed) * radius;
    camera.position.z = Math.sin(time * speed) * radius;
    camera.position.y = Math.sin(time * speed * 0.3) * 1.5 + 2; // Reduced vertical movement

    camera.lookAt(0, 0, 0);

    console.log('📷 Camera animating:', {
      time,
      speed,
      position: { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    });
  });

  return null;
}

function SceneContent({ colors, background, motion, texture, scale, aspectRatio, textures, uvTextures, textureTransforms }: {
  colors: TShirtModelProps['colors'],
  background?: BackgroundSettings,
  motion?: MotionSettings,
  texture?: TextureSettings,
  scale?: number,
  aspectRatio?: string,
  textures?: TShirtModelProps['textures'],
  uvTextures?: TShirtModelProps['uvTextures'],
  textureTransforms?: TShirtModelProps['textureTransforms']
}) {
  // Debug motion props in SceneContent
  useEffect(() => {
    console.log('🎭 SceneContent received motion:', motion);
    console.log('📏 SceneContent received scale:', scale);
    console.log('📐 SceneContent received aspectRatio:', aspectRatio);
  }, [motion, scale, aspectRatio]);

  // Calculate scale factor (25-200 range becomes 0.25-2.0)
  const scaleFactor = (scale || 100) / 100;

  // Calculate aspect ratio dimensions
  const getAspectRatioDimensions = (ratio: string) => {
    switch (ratio) {
      case '16:9':
        return { width: 16, height: 9 };
      case '4:3':
        return { width: 4, height: 3 };
      case '1:1':
        return { width: 1, height: 1 };
      case '9:16':
        return { width: 9, height: 16 };
      default:
        return { width: 16, height: 9 };
    }
  };

  const { width, height } = getAspectRatioDimensions(aspectRatio || '16:9');

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

      {/* 3D Background Element */}
      <BackgroundElement background={background} />

      {/* Ground plane for better depth perception */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial transparent opacity={0.1} />
      </mesh>

      <AnimatedTShirt
        colors={colors}
        textures={textures}
        uvTextures={uvTextures}
        textureTransforms={textureTransforms}
        motion={motion}
        scale={scaleFactor}
      />

      <AnimatedCamera motion={motion} />

      <OrbitControls
        enablePan={!motion?.cameraAnimation}
        enableZoom={true}
        enableRotate={!motion?.autoRotate && !motion?.cameraAnimation}
        minDistance={2}
        maxDistance={8}
        maxPolarAngle={Math.PI * 0.8}
        minPolarAngle={Math.PI * 0.2}
        autoRotate={false} // We'll handle rotation manually in AnimatedTShirt
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

interface BackgroundSettings {
  type: 'color' | 'image' | 'gradient';
  color?: string;
  image?: string;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    direction?: number;
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
  background?: BackgroundSettings;
  motion?: MotionSettings;
  texture?: TextureSettings;
  scale?: number;
  aspectRatio?: string;
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

export default function Scene3D({ className = '', colors, background, motion, texture, scale, aspectRatio, textures, uvTextures, textureTransforms }: Scene3DProps) {
  // 🔥 ULTIMATE TEST: Log received props immediately
  console.log('🔥 RECEIVED PROPS:', { textures, textureTransforms, background, motion });

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

  // Calculate camera settings based on aspect ratio
  const getCameraSettings = (ratio: string) => {
    const baseDistance = 6.5;
    switch (ratio) {
      case '16:9':
        return { position: [0, 0, baseDistance] as [number, number, number], fov: 45 };
      case '4:3':
        return { position: [0, 0, baseDistance * 1.1] as [number, number, number], fov: 50 };
      case '1:1':
        return { position: [0, 0, baseDistance * 1.2] as [number, number, number], fov: 55 };
      case '9:16':
        return { position: [0, 0, baseDistance * 0.9] as [number, number, number], fov: 40 };
      default:
        return { position: [0, 0, baseDistance] as [number, number, number], fov: 45 };
    }
  };

  const cameraSettings = getCameraSettings(aspectRatio || '16:9');

  return (
    <div className={`w-full h-full ${className} relative`}>
      <Canvas
        ref={canvasRef}
        camera={cameraSettings}
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
          <SceneContent
            colors={colors}
            background={background}
            motion={motion}
            texture={texture}
            scale={scale}
            aspectRatio={aspectRatio}
            textures={textures}
            uvTextures={uvTextures}
            textureTransforms={textureTransforms}
          />
        </Suspense>
      </Canvas>

      {/* 3D interaction hints */}
      {/* <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-xs text-gray-600 mb-2">3D Controls</div>
        <div className="flex flex-col gap-1 text-xs text-gray-500">
          <div>🖱️ Drag to rotate</div>
          <div>⚡ Scroll to zoom</div>
          <div>✋ Right-click to pan</div>
        </div>
      </div> */}
    </div>
  );
}
