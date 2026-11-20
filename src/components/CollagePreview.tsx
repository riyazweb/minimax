import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Minus,
  Move,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { CollageConfig, UploadedImage } from '../types/collage';
import { computeCollageLayout } from '../utils/collageLayout';
import { getPosterCropMetrics, renderCollageToCanvas } from '../utils/collageRenderer';

interface CollagePreviewProps {
  images: UploadedImage[];
  config: CollageConfig;
  onAddFiles: (files: FileList | File[]) => void;
  onLoadSamples: () => void;
  onRemoveImage: (index: number) => void;
  onSwapImages: (fromIndex: number, toIndex: number) => void;
  onUpdateImageTransform: (
    index: number,
    patch: Partial<Pick<UploadedImage, 'panX' | 'panY' | 'zoom'>>
  ) => void;
  onResetImageTransform: (index: number) => void;
  onTriggerFilePicker: () => void;
  isLoadingSamples: boolean;
}

export const CollagePreview: React.FC<CollagePreviewProps> = ({
  images,
  config,
  onAddFiles,
  onLoadSamples,
  onRemoveImage,
  onSwapImages,
  onUpdateImageTransform,
  onResetImageTransform,
  onTriggerFilePicker,
  isLoadingSamples,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const artboardRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);
  const [hoverTargetIndex, setHoverTargetIndex] = useState<number | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);

  const panSessionRef = useRef<{
    slotIndex: number;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
    zoom: number;
    slotScreenW: number;
    slotScreenH: number;
  } | null>(null);

  const layout = useMemo(() => computeCollageLayout(images, config, 1000), [images, config]);

  // Keep indices valid when images are removed or cleared
  useEffect(() => {
    if (editingSlotIndex !== null && (editingSlotIndex < 0 || editingSlotIndex >= images.length)) {
      setEditingSlotIndex(null);
    }
    if (selectedSlotIndex !== null && (selectedSlotIndex < 0 || selectedSlotIndex >= images.length)) {
      setSelectedSlotIndex(null);
    }
  }, [images.length, editingSlotIndex, selectedSlotIndex]);

  // Escape / Enter closes free-adjust mode
  useEffect(() => {
    if (editingSlotIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        setEditingSlotIndex(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingSlotIndex]);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas || images.length === 0) return;

    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    renderCollageToCanvas(canvas, images, config, 1000, dpr).catch((err) => {
      if (!cancelled) {
        console.error('Preview render failed:', err);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [images, config]);

  const handleArtboardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleArtboardDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingFile(false);
    }
  };

  const handleArtboardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const startPanSession = (
    e: React.PointerEvent<HTMLDivElement>,
    slotIndex: number,
    slotWidthLayout: number,
    slotHeightLayout: number
  ) => {
    if (editingSlotIndex !== slotIndex) return;
    if ((e.target as HTMLElement).closest('button')) return;

    const img = images[slotIndex];
    if (!img) return;

    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = e.currentTarget.getBoundingClientRect();
    let initialZoom = img.zoom;
    const metrics = getPosterCropMetrics(
      img.width,
      img.height,
      slotWidthLayout,
      slotHeightLayout,
      img.panX,
      img.panY,
      initialZoom
    );

    if (initialZoom <= 1.01 && metrics.maxShiftX < 2 && metrics.maxShiftY < 2) {
      initialZoom = 1.25;
      onUpdateImageTransform(slotIndex, { zoom: initialZoom });
    }

    panSessionRef.current = {
      slotIndex,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPanX: img.panX,
      startPanY: img.panY,
      zoom: initialZoom,
      slotScreenW: Math.max(1, rect.width),
      slotScreenH: Math.max(1, rect.height),
    };
  };

  const movePanSession = (
    e: React.PointerEvent<HTMLDivElement>,
    slotWidthLayout: number,
    slotHeightLayout: number
  ) => {
    const session = panSessionRef.current;
    if (!session) return;
    const img = images[session.slotIndex];
    if (!img) return;

    const dx = e.clientX - session.startClientX;
    const dy = e.clientY - session.startClientY;

    const { sw, sh, maxShiftX, maxShiftY } = getPosterCropMetrics(
      img.width,
      img.height,
      slotWidthLayout,
      slotHeightLayout,
      session.startPanX,
      session.startPanY,
      session.zoom
    );

    let nextPanX = session.startPanX;
    let nextPanY = session.startPanY;

    if (maxShiftX > 0.5) {
      const sourceDeltaX = (dx / session.slotScreenW) * sw;
      nextPanX = Math.max(-1, Math.min(1, session.startPanX + sourceDeltaX / maxShiftX));
    }
    if (maxShiftY > 0.5) {
      const sourceDeltaY = (dy / session.slotScreenH) * sh;
      nextPanY = Math.max(-1, Math.min(1, session.startPanY + sourceDeltaY / maxShiftY));
    }

    onUpdateImageTransform(session.slotIndex, { panX: nextPanX, panY: nextPanY });
  };

  const endPanSession = (e: React.PointerEvent<HTMLDivElement>) => {
    if (panSessionRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore if already released
      }
      panSessionRef.current = null;
    }
  };

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>, slotIndex: number) => {
    if (editingSlotIndex !== slotIndex) return;
    e.preventDefault();
    e.stopPropagation();
    const img = images[slotIndex];
    if (!img) return;
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    const nextZoom = Math.max(1, Math.min(3, Number((img.zoom + delta).toFixed(2))));
    onUpdateImageTransform(slotIndex, { zoom: nextZoom });
  };

  const aspectRatioStyle = {
    aspectRatio: `${layout.canvasWidth} / ${layout.canvasHeight}`,
  };

  const editingImage = editingSlotIndex !== null ? images[editingSlotIndex] : null;
  const selectedImage =
    editingSlotIndex === null && selectedSlotIndex !== null ? images[selectedSlotIndex] : null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Artboard Outer Stage */}
      <div
        ref={artboardRef}
        onDragOver={handleArtboardDragOver}
        onDragLeave={handleArtboardDragLeave}
        onDrop={handleArtboardDrop}
        style={aspectRatioStyle}
        className={`relative w-full max-w-[640px] bg-white border transition-colors duration-150 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.10)] ${
          isDraggingFile ? 'border-[#A90D18] ring-4 ring-[#A90D18]/10' : 'border-slate-200'
        }`}
      >
        {images.length === 0 ? (
          /* Empty State Artboard mirroring the active template */
          <div
            className="absolute inset-0 flex flex-col justify-between p-5 sm:p-10 select-none overflow-hidden"
            style={{
              borderRadius: config.cornerRadius > 0 ? `${Math.round(config.cornerRadius * 0.65)}px` : undefined,
            }}
          >
            {config.showTitle && config.templateId === 'editorial-wall' && (
              <div className="w-full text-center pt-2 sm:pt-5">
                <h2
                  className="font-semibold tracking-[-0.036em] leading-none"
                  style={{
                    fontFamily: `"${config.titleFont}", Georgia, serif`,
                    color: config.titleColor,
                    fontSize: 'clamp(1.85rem, 5vw, 3.25rem)',
                  }}
                >
                  {config.title || 'Maximalism'}
                </h2>
              </div>
            )}

            {config.showTitle && config.templateId !== 'editorial-wall' && (
              <div className="w-full flex justify-center pt-1 sm:pt-2">
                {config.templateId === 'quad-center-badge' ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-2 border-slate-900 rounded-full shadow-sm max-w-full">
                    {config.badgeTag.trim() && (
                      <span
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-slate-900 text-white text-[10px] sm:text-[11px] font-extrabold flex items-center justify-center shrink-0"
                        style={{ backgroundColor: config.titleColor }}
                      >
                        {config.badgeTag.trim()}
                      </span>
                    )}
                    <span
                      className="text-xs sm:text-base font-extrabold uppercase tracking-tight text-slate-900 truncate"
                      style={{ fontFamily: `"${config.titleFont}", "Plus Jakarta Sans", sans-serif` }}
                    >
                      {config.title || 'DESI MAXIMALISM'}
                    </span>
                  </div>
                ) : (
                  <div className="inline-block px-4 py-1.5 sm:px-5 sm:py-2 bg-white border border-slate-200 shadow-sm max-w-full">
                    <span
                      className="text-[11px] sm:text-sm font-bold uppercase tracking-tight block truncate"
                      style={{
                        fontFamily: `"${config.titleFont}", "Plus Jakarta Sans", sans-serif`,
                        color: config.titleColor,
                      }}
                    >
                      {config.title || 'HYPER-REAL 3D CHARACTER DESIGN'}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 flex flex-col items-center justify-center my-3 sm:my-6 border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 sm:px-6 sm:py-10 text-center transition-colors hover:border-slate-400">
              <div className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 mb-3 shadow-xs">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                Tap to upload 1, 2, 4, 6, or any images
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
                {config.templateId === 'editorial-wall'
                  ? '1 image centers cleanly. 2 images align left & right. 6+ arrange in the staggered wall.'
                  : config.templateId === 'top-bottom-center'
                  ? 'Top & bottom split with your text centered in the middle.'
                  : config.templateId === 'left-right-center'
                  ? 'Left & right split with your text centered in the middle.'
                  : 'Full-bleed 2×2 quad grid with your banner text centered cleanly.'}
              </p>

              <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={onTriggerFilePicker}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#A90D18] hover:bg-[#8E0B14] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4" />
                  Select Photos
                </button>
                <button
                  type="button"
                  onClick={onLoadSamples}
                  disabled={isLoadingSamples}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-[#A90D18]" />
                  {isLoadingSamples ? 'Loading...' : 'Try Sample'}
                </button>
              </div>
            </div>

            <div className="text-center text-[11px] sm:text-xs text-slate-400">
              HD PNG &amp; JPG export up to 4096 px
            </div>
          </div>
        ) : (
          <>
            {/* Pixel-accurate live Canvas Preview */}
            <canvas
              ref={canvasRef}
              className="w-full h-full block"
              aria-label="Live editorial collage preview"
            />

            {/* Interactive Slot Overlay */}
            <div className="absolute inset-0">
              {layout.slots.map((slot) => {
                const img = images[slot.imageIndex];
                if (!img) return null;
                const leftPct = (slot.x / layout.canvasWidth) * 100;
                const topPct = (slot.y / layout.canvasHeight) * 100;
                const widthPct = (slot.width / layout.canvasWidth) * 100;
                const heightPct = (slot.height / layout.canvasHeight) * 100;
                const isEditingThis = editingSlotIndex === slot.imageIndex;
                const isSelectedThis = !isEditingThis && selectedSlotIndex === slot.imageIndex;
                const isDropTarget =
                  !isEditingThis &&
                  hoverTargetIndex === slot.imageIndex &&
                  draggedSlotIndex !== null &&
                  draggedSlotIndex !== slot.imageIndex;

                return (
                  <div
                    key={img.id}
                    draggable={!isEditingThis}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setSelectedSlotIndex(slot.imageIndex);
                      setEditingSlotIndex((prev) =>
                        prev === slot.imageIndex ? null : slot.imageIndex
                      );
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (editingSlotIndex !== null && editingSlotIndex !== slot.imageIndex) {
                        setEditingSlotIndex(null);
                      }
                      setSelectedSlotIndex((prev) =>
                        prev === slot.imageIndex ? null : slot.imageIndex
                      );
                    }}
                    onPointerDown={(e) => startPanSession(e, slot.imageIndex, slot.width, slot.height)}
                    onPointerMove={(e) => movePanSession(e, slot.width, slot.height)}
                    onPointerUp={endPanSession}
                    onPointerCancel={endPanSession}
                    onWheel={(e) => handleWheelZoom(e, slot.imageIndex)}
                    onDragStart={(e) => {
                      if (isEditingThis) {
                        e.preventDefault();
                        return;
                      }
                      setDraggedSlotIndex(slot.imageIndex);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', String(slot.imageIndex));
                    }}
                    onDragOver={(e) => {
                      if (draggedSlotIndex !== null && !isEditingThis) {
                        e.preventDefault();
                        setHoverTargetIndex(slot.imageIndex);
                      }
                    }}
                    onDragLeave={() => {
                      if (hoverTargetIndex === slot.imageIndex) {
                        setHoverTargetIndex(null);
                      }
                    }}
                    onDrop={(e) => {
                      if (draggedSlotIndex !== null && draggedSlotIndex !== slot.imageIndex) {
                        e.preventDefault();
                        e.stopPropagation();
                        onSwapImages(draggedSlotIndex, slot.imageIndex);
                      }
                      setDraggedSlotIndex(null);
                      setHoverTargetIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedSlotIndex(null);
                      setHoverTargetIndex(null);
                    }}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                      touchAction: isEditingThis ? 'none' : 'manipulation',
                    }}
                    className={`group absolute transition-all duration-150 ${
                      isEditingThis
                        ? 'ring-2 ring-[#A90D18] bg-[#A90D18]/5 cursor-move z-20'
                        : isSelectedThis
                        ? 'ring-2 ring-slate-900 z-10'
                        : isDropTarget
                        ? 'ring-2 ring-[#A90D18] bg-[#A90D18]/15 cursor-grab'
                        : 'hover:ring-2 hover:ring-slate-900/75 cursor-pointer lg:cursor-grab'
                    }`}
                  >
                    {isEditingThis ? (
                      <div className="absolute inset-x-1.5 top-1.5 flex items-center justify-between gap-1 pointer-events-none">
                        <span className="px-2 py-0.5 text-[11px] font-medium bg-[#A90D18] text-white rounded shadow-xs">
                          Drag to move
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSlotIndex(null);
                          }}
                          className="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded shadow-xs cursor-pointer hover:bg-slate-800"
                        >
                          <Check className="w-3 h-3" />
                          Done
                        </button>
                      </div>
                    ) : (
                      /* Desktop Hover Action Bar */
                      <div className="hidden lg:flex opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 absolute inset-x-1.5 top-1.5 items-center justify-between gap-1 pointer-events-none">
                        <span className="px-1.5 py-0.5 text-[11px] font-mono-num font-medium bg-slate-900/85 text-white rounded">
                          {slot.imageIndex + 1}
                        </span>

                        <div className="flex items-center gap-1 pointer-events-auto">
                          {slot.imageIndex > 0 && (
                            <button
                              type="button"
                              title="Move earlier"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSwapImages(slot.imageIndex, slot.imageIndex - 1);
                              }}
                              className="p-1 bg-white/95 hover:bg-white text-slate-800 rounded shadow-xs cursor-pointer"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                          {slot.imageIndex < images.length - 1 && (
                            <button
                              type="button"
                              title="Move later"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSwapImages(slot.imageIndex, slot.imageIndex + 1);
                              }}
                              className="p-1 bg-white/95 hover:bg-white text-slate-800 rounded shadow-xs cursor-pointer"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Adjust image position & zoom inside frame"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSlotIndex(slot.imageIndex);
                            }}
                            className="inline-flex items-center gap-1 px-1.5 py-1 bg-white/95 hover:bg-white text-slate-800 rounded shadow-xs text-[10px] font-medium cursor-pointer"
                          >
                            <Move className="w-3 h-3" />
                            Adjust
                          </button>
                          <button
                            type="button"
                            title="Remove image"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveImage(slot.imageIndex);
                            }}
                            className="p-1 bg-white/95 hover:bg-red-600 hover:text-white text-slate-800 rounded shadow-xs cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Drag-over overlay */}
        {isDraggingFile && images.length > 0 && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none z-20">
            <Upload className="w-7 h-7 text-[#A90D18] mb-2" />
            <p className="text-sm font-semibold text-slate-900">Drop to add images to collage</p>
          </div>
        )}
      </div>

      {/* Touch-friendly Action Bar when a tile is tapped (Selected) */}
      {selectedImage && selectedSlotIndex !== null && (
        <div className="w-full max-w-[640px] mt-3 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-900 font-mono-num">
              Photo #{selectedSlotIndex + 1}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={selectedSlotIndex === 0}
              onClick={() => {
                onSwapImages(selectedSlotIndex, selectedSlotIndex - 1);
                setSelectedSlotIndex(selectedSlotIndex - 1);
              }}
              aria-label="Move earlier"
              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center border border-slate-200 rounded-lg bg-white text-slate-700 disabled:opacity-35 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={selectedSlotIndex === images.length - 1}
              onClick={() => {
                onSwapImages(selectedSlotIndex, selectedSlotIndex + 1);
                setSelectedSlotIndex(selectedSlotIndex + 1);
              }}
              aria-label="Move later"
              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center border border-slate-200 rounded-lg bg-white text-slate-700 disabled:opacity-35 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setEditingSlotIndex(selectedSlotIndex)}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3 text-xs font-semibold text-white bg-[#A90D18] hover:bg-[#8E0B14] rounded-lg cursor-pointer whitespace-nowrap"
            >
              <Move className="w-3.5 h-3.5" />
              Pan &amp; Zoom
            </button>
            <button
              type="button"
              onClick={() => {
                onRemoveImage(selectedSlotIndex);
                setSelectedSlotIndex(null);
              }}
              aria-label="Remove photo"
              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center border border-red-200 text-red-600 bg-red-50/50 hover:bg-red-100 rounded-lg cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedSlotIndex(null)}
              aria-label="Close photo actions"
              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Active Slot Position & Zoom Bar (shown when double-tapped / adjusting) */}
      {editingImage && editingSlotIndex !== null && (
        <div className="w-full max-w-[640px] mt-3 bg-white border border-[#A90D18]/40 rounded-xl px-3.5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center justify-between sm:justify-start gap-2 text-xs">
            <span className="font-semibold text-[#A90D18] font-mono-num">
              Adjusting #{editingSlotIndex + 1}
            </span>
            <span className="text-slate-500">Drag photo inside box</span>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                title="Zoom out"
                onClick={() =>
                  onUpdateImageTransform(editingSlotIndex, {
                    zoom: Math.max(1, Number((editingImage.zoom - 0.15).toFixed(2))),
                  })
                }
                className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={editingImage.zoom}
                onChange={(e) =>
                  onUpdateImageTransform(editingSlotIndex, {
                    zoom: parseFloat(e.target.value),
                  })
                }
                aria-label="Image zoom"
                className="studio-slider w-24 sm:w-28"
              />
              <button
                type="button"
                title="Zoom in"
                onClick={() =>
                  onUpdateImageTransform(editingSlotIndex, {
                    zoom: Math.min(3, Number((editingImage.zoom + 0.15).toFixed(2))),
                  })
                }
                className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono-num text-slate-600 w-10 text-right">
                {editingImage.zoom.toFixed(2)}×
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onResetImageTransform(editingSlotIndex)}
                className="min-h-[40px] inline-flex items-center gap-1 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={() => setEditingSlotIndex(null)}
                className="min-h-[40px] inline-flex items-center gap-1 px-3.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiet Canvas Metadata Strip */}
      <div className="w-full max-w-[640px] mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">{layout.layoutLabel}</span>
          {images.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="hidden sm:inline">Drag to swap · Double-click to move/zoom</span>
              <span className="sm:hidden">Tap photo to edit · Double-tap to move</span>
            </>
          )}
        </div>
        <span className="font-mono-num">{config.canvasAspect}</span>
      </div>
    </div>
  );
};
