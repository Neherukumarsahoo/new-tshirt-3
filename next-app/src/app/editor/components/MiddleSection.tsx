import React, { useEffect, useRef, useState } from 'react';

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
  flipH?: boolean;
  flipV?: boolean;
  zIndex?: number;
  locked?: boolean;
  opacity?: number;
  cornerRadius?: number;
}

interface TShirtSectionProps {
  title: string;
  section: 'front' | 'back' | 'leftSleeve' | 'rightSleeve';
  placedImages: PlacedImage[];
  selectedImage: string | null;
  onSelectImage: (id: string | null) => void;
  onImageTransform: (imageId: string, transforms: Partial<PlacedImage>) => void;
  onRemoveImage: (imageId: string) => void;
}

function TShirtSection({
  title,
  section,
  placedImages,
  selectedImage,
  onSelectImage,
  onImageTransform,
  onRemoveImage,
}: TShirtSectionProps) {
  const sectionImage = placedImages.find(img => img.section === section) ?? null;
  const DEFAULT_BASE = 200;
  const baseSizeRef = useRef<number>(DEFAULT_BASE);

  // UI local state
  const [localOpacity, setLocalOpacity] = useState<number>(1);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // refs
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const pointerState = useRef<any>({
    active: false,
    pointerId: undefined,
    mode: undefined,
    startClientX: 0,
    startClientY: 0,
    startPosX: 0,
    startPosY: 0,
    startScale: 1,
    startRotation: 0,
    startCrop: undefined,
    aspectLock: false,
  });

  const rafRef = useRef<number | null>(null);
  const pendingTransformRef = useRef<Partial<PlacedImage> | null>(null);

  useEffect(() => {
    if (sectionImage) {
      setLocalOpacity(typeof (sectionImage as any).opacity === 'number' ? (sectionImage as any).opacity : 1);
      setIsLocked(!!(sectionImage as any).locked);
    }
  }, [sectionImage]);

  // derive a sensible base size from image natural size
  useEffect(() => {
    if (!sectionImage) return;
    const img = new Image();
    img.onload = () => {
      const largest = Math.max(img.naturalWidth, img.naturalHeight);
      baseSizeRef.current = Math.min(800, Math.max(120, Math.round(largest / 2)));
    };
    img.src = sectionImage.url;
  }, [sectionImage?.url]);

  const scheduleTransformUpdate = (partial: Partial<PlacedImage>) => {
    pendingTransformRef.current = { ...(pendingTransformRef.current || {}), ...partial };
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        if (pendingTransformRef.current && sectionImage) {
          onImageTransform(sectionImage.id, pendingTransformRef.current as Partial<PlacedImage>);
        }
        pendingTransformRef.current = null;
        rafRef.current = null;
      });
    }
  };

  const startPointer = (e: React.PointerEvent, mode: string = 'move') => {
    e.stopPropagation();
    if (!sectionImage) return;
    if ((sectionImage as any).locked) return;
    const el = wrapperRef.current;
    if (!el) return;

    // capture pointer on wrapper so we keep getting move events
    try {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } catch (err) {}
    

    pointerState.current = {
      active: true,
      pointerId: e.pointerId,
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPosX: sectionImage.position.x,
      startPosY: sectionImage.position.y,
      startScale: sectionImage.scale,
      startRotation: sectionImage.rotation,
      startCrop: sectionImage.cropData ? { ...sectionImage.cropData } : { x: 0, y: 0, width: baseSizeRef.current, height: baseSizeRef.current },
      aspectLock: (e as any).shiftKey || false,
    };
  };

  useEffect(() => {
    const onMove = (ev: PointerEvent) => {
      if (!pointerState.current.active || !sectionImage) return;
      if (pointerState.current.pointerId !== undefined && ev.pointerId !== pointerState.current.pointerId) return;

      const ps = pointerState.current;
      const dx = ev.clientX - ps.startClientX;
      const dy = ev.clientY - ps.startClientY;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      switch (ps.mode) {
        case 'move': {
          const newX = ps.startPosX + dx;
          const newY = ps.startPosY + dy;
          scheduleTransformUpdate({ position: { x: Math.round(newX), y: Math.round(newY) } });
          break;
        }
        case 'scale-tl':
        case 'scale-tr':
        case 'scale-bl':
        case 'scale-br': {
          const startDist = Math.hypot(ps.startClientX - cx, ps.startClientY - cy);
          const curDist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
          const ratio = curDist / Math.max(1, startDist);
          const newScale = Math.max(0.02, ps.startScale * ratio);
          scheduleTransformUpdate({ scale: newScale });
          break;
        }
        case 'rotate': {
          const startAngle = Math.atan2(ps.startClientY - cy, ps.startClientX - cx);
          const currentAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx);
          const deltaAngle = (currentAngle - startAngle) * (180 / Math.PI);
          const newRotation = ps.startRotation + deltaAngle;
          scheduleTransformUpdate({ rotation: newRotation });
          break;
        }
        case 'crop-tl':
        case 'crop-tr':
        case 'crop-bl':
        case 'crop-br': {
          // compute crop delta in wrapper-local pixels (unrotated assumption)
          const base = baseSizeRef.current;
          const rawDX = (ev.clientX - ps.startClientX) / ps.startScale;
          const rawDY = (ev.clientY - ps.startClientY) / ps.startScale;
          let newCrop = { ...ps.startCrop };
          const minSize = 10;
          switch (ps.mode) {
            case 'crop-tl':
              newCrop.x = Math.min(ps.startCrop.x + ps.startCrop.width - minSize, ps.startCrop.x + rawDX);
              newCrop.y = Math.min(ps.startCrop.y + ps.startCrop.height - minSize, ps.startCrop.y + rawDY);
              newCrop.width = ps.startCrop.width - (newCrop.x - ps.startCrop.x);
              newCrop.height = ps.startCrop.height - (newCrop.y - ps.startCrop.y);
              break;
            case 'crop-tr':
              newCrop.y = Math.min(ps.startCrop.y + ps.startCrop.height - minSize, ps.startCrop.y + rawDY);
              newCrop.width = Math.max(minSize, ps.startCrop.width + rawDX);
              newCrop.height = ps.startCrop.height - (newCrop.y - ps.startCrop.y);
              break;
            case 'crop-bl':
              newCrop.x = Math.min(ps.startCrop.x + ps.startCrop.width - minSize, ps.startCrop.x + rawDX);
              newCrop.width = ps.startCrop.width - (newCrop.x - ps.startCrop.x);
              newCrop.height = Math.max(minSize, ps.startCrop.height + rawDY);
              break;
            case 'crop-br':
              newCrop.width = Math.max(minSize, ps.startCrop.width + rawDX);
              newCrop.height = Math.max(minSize, ps.startCrop.height + rawDY);
              break;
          }
          const clamp = (v: number, a = 0, b = base) => Math.max(a, Math.min(b, v));
          newCrop.x = clamp(newCrop.x);
          newCrop.y = clamp(newCrop.y);
          newCrop.width = Math.max(minSize, Math.min(base - newCrop.x, newCrop.width));
          newCrop.height = Math.max(minSize, Math.min(base - newCrop.y, newCrop.height));
          scheduleTransformUpdate({ cropData: { x: Math.round(newCrop.x), y: Math.round(newCrop.y), width: Math.round(newCrop.width), height: Math.round(newCrop.height) } });
          break;
        }
      }
    };

    const onUp = (ev: PointerEvent) => {
      if (!pointerState.current.active) return;
      try { wrapperRef.current?.releasePointerCapture(ev.pointerId); } catch (_) { }
      pointerState.current.active = false;
      pointerState.current.pointerId = undefined;
      pointerState.current.mode = undefined;
      pointerState.current.startCrop = undefined;
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [sectionImage, onImageTransform]);

  // toolbar actions
  const toggleFlipH = (e?: React.MouseEvent) => { e?.stopPropagation(); if (!sectionImage) return; scheduleTransformUpdate({ ['flipH']: !(sectionImage as any).flipH }); };
  const toggleFlipV = (e?: React.MouseEvent) => { e?.stopPropagation(); if (!sectionImage) return; scheduleTransformUpdate({ ['flipV']: !(sectionImage as any).flipV }); };
  const applyAlign = (type: 'center' | 'top' | 'bottom' | 'left' | 'right') => {
    if (!sectionImage) return;
    const parent = wrapperRef.current?.parentElement;
    if (!parent) return;
    const pRect = parent.getBoundingClientRect();
    const w = baseSizeRef.current * 1;
    const h = baseSizeRef.current * 1;
    let nx = sectionImage.position.x, ny = sectionImage.position.y;
    switch (type) {
      case 'center': nx = (pRect.width - w) / 2; ny = (pRect.height - h) / 2; break;
      case 'top': nx = (pRect.width - w) / 2; ny = 0; break;
      case 'bottom': nx = (pRect.width - w) / 2; ny = pRect.height - h; break;
      case 'left': nx = 0; ny = (pRect.height - h) / 2; break;
      case 'right': nx = pRect.width - w; ny = (pRect.height - h) / 2; break;
    }
    scheduleTransformUpdate({ position: { x: Math.round(nx), y: Math.round(ny) } });
  };
  const bringForward = (e?: React.MouseEvent) => { e?.stopPropagation(); if (!sectionImage) return; const z = (sectionImage as any).zIndex ?? 0; scheduleTransformUpdate({ ['zIndex']: z + 1 }); };
  const sendBackward = (e?: React.MouseEvent) => { e?.stopPropagation(); if (!sectionImage) return; const z = (sectionImage as any).zIndex ?? 0; scheduleTransformUpdate({ ['zIndex']: z - 1 }); };
  const toggleLock = (e?: React.MouseEvent) => { e?.stopPropagation(); if (!sectionImage) return; const next = !((sectionImage as any).locked); scheduleTransformUpdate({ ['locked']: next }); setIsLocked(next); };
  const handleOpacityChange = (val: number) => { if (!sectionImage) return; setLocalOpacity(val); scheduleTransformUpdate({ ['opacity']: val }); };
  const handleDelete = (e?: React.MouseEvent) => { e?.stopPropagation(); if (!sectionImage) return; onRemoveImage(sectionImage.id); };

  const handleWrapperClick = (e: React.MouseEvent) => { if (!sectionImage) return; onSelectImage(selectedImage === sectionImage.id ? null : sectionImage.id); };

  if (!sectionImage) {
    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden h-full">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-800 text-center">{title}</h3>
        </div>
        <div className="relative h-full bg-gray-100 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <span className="text-3xl mb-2 block">👕</span>
            <p className="text-sm">No design</p>
          </div>
        </div>
      </div>
    );
  }

  const baseSize = baseSizeRef.current;
  const crop = sectionImage.cropData ?? { x: 0, y: 0, width: baseSize, height: baseSize };
  const flipH = !!(sectionImage as any).flipH;
  const flipV = !!(sectionImage as any).flipV;
  const cornerRadius = (sectionImage as any).cornerRadius ?? 0;
  const zIndex = (sectionImage as any).zIndex ?? 0;
  const opacity = typeof (sectionImage as any).opacity === 'number' ? (sectionImage as any).opacity : 1;
  const isSelected = selectedImage === sectionImage.id;

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden h-full">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-800 text-center">{title}</h3>
      </div>

      <div className="relative h-full bg-gray-100">
        <div
          ref={wrapperRef}
          style={{
            position: 'absolute',
            left: sectionImage.position.x,
            top: sectionImage.position.y,
            width: baseSize * sectionImage.scale,
height: baseSize * sectionImage.scale,
            transform: `rotate(${sectionImage.rotation}deg)`,
            transformOrigin: 'center center',
            touchAction: 'none',
            userSelect: 'none',
            zIndex,
          }}
          onClick={handleWrapperClick}
          onPointerDown={(e) => {
            // if target is a handle we let handle's pointerdown start the specialized action
            if ((e.target as HTMLElement).dataset?.handle) return;
            startPointer(e as any, 'move');
          }}
        >
          <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: cornerRadius, position: 'relative' }}>
            <img
              ref={imgRef}
              src={sectionImage.url}
              alt={`${title} design`}
              draggable={false}
              style={{
                position: 'absolute',
                left: -crop.x,
                top: -crop.y,
                width: baseSize * sectionImage.scale,
                height: baseSize * sectionImage.scale,
                
                transform: `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                transformOrigin: 'center center',
                opacity,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />

            {isSelected && (
              <div style={{ position: 'absolute', left: 0, top: 0, width: baseSize, height: baseSize, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', left: crop.x, top: crop.y, width: crop.width, height: crop.height, border: '2px dashed rgba(219,39,119,0.9)', background: 'rgba(219,39,119,0.05)', pointerEvents: 'none' }} />
              </div>
            )}
          </div>

          {/* Handles (children so they move/rotate with wrapper) */}
          {isSelected && (
            <>
              <div data-handle="tl" data-handle-name="tl" onPointerDown={(e) => startPointer(e as any, 'scale-tl')} style={handleCss(-8, -8)} />
              <div data-handle="tr" data-handle-name="tr" onPointerDown={(e) => startPointer(e as any, 'scale-tr')} style={handleCss(undefined, -8, -8, undefined)} />
              <div data-handle="bl" data-handle-name="bl" onPointerDown={(e) => startPointer(e as any, 'scale-bl')} style={handleCss(-8, undefined, undefined, -8)} />
              <div data-handle="br" data-handle-name="br" onPointerDown={(e) => startPointer(e as any, 'scale-br')} style={handleCss(undefined, undefined, -8, -8)} />

              <div data-handle="rotate" onPointerDown={(e) => startPointer(e as any, 'rotate')} style={{ position: 'absolute', left: '50%', top: -28, transform: 'translateX(-50%)', width: 16, height: 16, borderRadius: 8, background: '#3b82f6', border: '2px solid white', cursor: 'grab', zIndex: 40 }} />

              {/* crop handles (absolute within wrapper so they follow crop rect) */}
              <div data-handle="crop-tl" onPointerDown={(e) => startPointer(e as any, 'crop-tl')} style={{ position: 'absolute', left: crop.x - 6, top: crop.y - 6, width: 12, height: 12, background: '#ef4444', border: '2px solid white', cursor: 'nwse-resize', zIndex: 45 }} />
              <div data-handle="crop-tr" onPointerDown={(e) => startPointer(e as any, 'crop-tr')} style={{ position: 'absolute', left: crop.x + crop.width - 6, top: crop.y - 6, width: 12, height: 12, background: '#ef4444', border: '2px solid white', cursor: 'nesw-resize', zIndex: 45 }} />
              <div data-handle="crop-bl" onPointerDown={(e) => startPointer(e as any, 'crop-bl')} style={{ position: 'absolute', left: crop.x - 6, top: crop.y + crop.height - 6, width: 12, height: 12, background: '#ef4444', border: '2px solid white', cursor: 'nesw-resize', zIndex: 45 }} />
              <div data-handle="crop-br" onPointerDown={(e) => startPointer(e as any, 'crop-br')} style={{ position: 'absolute', left: crop.x + crop.width - 6, top: crop.y + crop.height - 6, width: 12, height: 12, background: '#ef4444', border: '2px solid white', cursor: 'nwse-resize', zIndex: 45 }} />

              {/* small toolbar */}
              <div style={{ position: 'absolute', left: 6, top: 6, zIndex: 60, display: 'flex', gap: 6 }}>
                <button onClick={(e) => { e.stopPropagation(); toggleFlipH(e); }} title="Flip horizontal" className="px-1 py-0.5 text-xs bg-white rounded border">↔</button>
                <button onClick={(e) => { e.stopPropagation(); toggleFlipV(e); }} title="Flip vertical" className="px-1 py-0.5 text-xs bg-white rounded border">↕</button>
                <button onClick={(e) => { e.stopPropagation(); toggleLock(e); }} title={isLocked ? 'Unlock' : 'Lock'} className="px-1 py-0.5 text-xs bg-white rounded border">{isLocked ? '🔒' : '🔓'}</button>
                <button onClick={(e) => { e.stopPropagation(); bringForward(e); }} title="Bring forward" className="px-1 py-0.5 text-xs bg-white rounded border">↑</button>
                <button onClick={(e) => { e.stopPropagation(); sendBackward(e); }} title="Send backward" className="px-1 py-0.5 text-xs bg-white rounded border">↓</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(e); }} title="Delete" className="px-1 py-0.5 text-xs bg-white rounded border text-red-600">✕</button>
              </div>

              <div style={{ position: 'absolute', left: 6, bottom: 6, zIndex: 60, display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="range" min={0} max={1} step={0.01} value={localOpacity} onChange={(ev) => handleOpacityChange(Number((ev.target as HTMLInputElement).value))} onPointerDown={(e) => e.stopPropagation()} style={{ width: 80 }} />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={(e) => { e.stopPropagation(); applyAlign('left'); }} className="px-1 py-0.5 text-xs bg-white rounded border">L</button>
                  <button onClick={(e) => { e.stopPropagation(); applyAlign('center'); }} className="px-1 py-0.5 text-xs bg-white rounded border">C</button>
                  <button onClick={(e) => { e.stopPropagation(); applyAlign('right'); }} className="px-1 py-0.5 text-xs bg-white rounded border">R</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// helper
function handleCss(left?: number, top?: number, right?: number, bottom?: number): React.CSSProperties {
  const base: React.CSSProperties = { position: 'absolute', width: 12, height: 12, background: '#ec4899', border: '2px solid white', borderRadius: 3, zIndex: 50, cursor: 'nwse-resize', touchAction: 'none' };
  if (left !== undefined) base.left = left;
  if (top !== undefined) base.top = top;
  if (right !== undefined) base.right = right;
  if (bottom !== undefined) base.bottom = bottom;
  return base;
}
