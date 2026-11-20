import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  ImagePlus,
  Images,
  LayoutGrid,
  Plus,
  Sparkles,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import { CollagePreview } from './components/CollagePreview';
import { ControlSidebar } from './components/ControlSidebar';
import { TemplateSelector } from './components/TemplateSelector';
import {
  CollageConfig,
  ExportCompression,
  ExportFormat,
  ExportResolution,
  TemplateId,
  UploadedImage,
} from './types/collage';
import { exportCollageHD, formatFileSize } from './utils/collageRenderer';
import { loadUploadedFiles } from './utils/imageLoader';
import { generateSamplePosters } from './utils/samplePosters';

type MobileTab = 'templates' | 'photos' | 'text' | 'export';

const DEFAULT_CONFIG: CollageConfig = {
  templateId: 'editorial-wall',
  title: 'Maximalism',
  badgeTag: '01',
  showTitle: true,
  titleColor: '#A90D18',
  titleFont: 'Playfair Display',
  titleScale: 1,
  backgroundColor: '#FFFFFF',
  canvasAspect: '1:1',
  layoutStyle: 'staggered',
  fitMode: 'poster',
  gapScale: 1,
  cornerRadius: 0,
};

const TEMPLATE_DEFAULT_TITLES: Record<TemplateId, string> = {
  'editorial-wall': 'Maximalism',
  'quad-center-bar': 'HYPER-REAL 3D CHARACTER DESIGN',
  'quad-center-badge': 'DESI MAXIMALISM',
  'top-bottom-center': 'EDITORIAL SPLIT',
  'left-right-center': 'SIDE BY SIDE',
};

export default function App() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [config, setConfig] = useState<CollageConfig>(DEFAULT_CONFIG);
  const [hasCustomTitle, setHasCustomTitle] = useState(false);
  const [resolution, setResolution] = useState<ExportResolution>(3200);
  const [format, setFormat] = useState<ExportFormat>('webp');
  const [compression, setCompression] = useState<ExportCompression>('compact');
  const [cloudinarySafe, setCloudinarySafe] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('templates');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imagesRef = useRef<UploadedImage[]>(images);
  imagesRef.current = images;

  useEffect(() => {
    return () => {
      for (const img of imagesRef.current) {
        URL.revokeObjectURL(img.url);
      }
    };
  }, []);

  const handleAddFiles = useCallback(async (files: FileList | File[]) => {
    setErrorMessage(null);
    setExportSuccess(null);
    const { loaded, errors } = await loadUploadedFiles(files);
    if (errors.length > 0) {
      setErrorMessage(errors[0]);
    }
    if (loaded.length > 0) {
      setImages((prev) => [...prev, ...loaded]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleAddFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleTriggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleLoadSamples = async () => {
    setIsLoadingSamples(true);
    setErrorMessage(null);
    setExportSuccess(null);
    try {
      const samples = await generateSamplePosters();
      setImages((prev) => {
        for (const old of prev) URL.revokeObjectURL(old.url);
        return samples;
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create sample posters.');
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setExportSuccess(null);
    setImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleClearAll = () => {
    setExportSuccess(null);
    setErrorMessage(null);
    setImages((prev) => {
      for (const item of prev) URL.revokeObjectURL(item.url);
      return [];
    });
  };

  const handleSwapImages = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setExportSuccess(null);
    setImages((prev) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const temp = next[fromIndex];
      next[fromIndex] = next[toIndex];
      next[toIndex] = temp;
      return next;
    });
  };

  const handleUpdateImageTransform = useCallback(
    (index: number, patch: Partial<Pick<UploadedImage, 'panX' | 'panY' | 'zoom'>>) => {
      setExportSuccess(null);
      setImages((prev) =>
        prev.map((img, i) => (i === index ? { ...img, ...patch } : img))
      );
    },
    []
  );

  const handleResetImageTransform = useCallback((index: number) => {
    setExportSuccess(null);
    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, panX: 0, panY: 0, zoom: 1 } : img
      )
    );
  }, []);

  const handleSelectTemplate = (templateId: TemplateId) => {
    setExportSuccess(null);
    setConfig((prev) => {
      const isEditorial = templateId === 'editorial-wall';
      return {
        ...prev,
        templateId,
        title: hasCustomTitle ? prev.title : TEMPLATE_DEFAULT_TITLES[templateId],
        titleFont: isEditorial ? 'Playfair Display' : 'Plus Jakarta Sans',
        titleColor:
          templateId === 'editorial-wall' || templateId === 'quad-center-badge'
            ? '#A90D18'
            : '#111827',
        gapScale: isEditorial ? 1 : 0,
        cornerRadius: isEditorial ? 0 : 24,
      };
    });
  };

  const handleChangeConfig = <K extends keyof CollageConfig>(key: K, value: CollageConfig[K]) => {
    setExportSuccess(null);
    if (key === 'title') {
      setHasCustomTitle(true);
    }
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetSettings = () => {
    setExportSuccess(null);
    setHasCustomTitle(false);
    setConfig(DEFAULT_CONFIG);
    setResolution(3200);
    setFormat('webp');
    setCompression('compact');
    setCloudinarySafe(true);
  };

  const handleExport = async () => {
    if (images.length === 0 || isExporting) return;
    setIsExporting(true);
    setErrorMessage(null);
    setExportSuccess(null);
    try {
      const result = await exportCollageHD(
        images,
        config,
        resolution,
        format,
        compression,
        cloudinarySafe
      );
      const sizeStr = formatFileSize(result.fileSizeBytes);
      setExportSuccess(
        `Saved ${result.width} × ${result.height} px ${result.actualFormat.toUpperCase()} (${sizeStr})`
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderPhotoSequence = () => (
    <section
      id="queue-strip"
      className="w-full max-w-[640px] bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-900">
          Photos ({images.length})
        </span>
        {images.length === 0 ? (
          <button
            type="button"
            onClick={handleLoadSamples}
            disabled={isLoadingSamples}
            className="text-xs font-medium text-[#A90D18] cursor-pointer"
          >
            {isLoadingSamples ? 'Loading...' : 'Load Sample Posters'}
          </button>
        ) : (
          <span className="text-xs text-slate-400">Reorder or remove</span>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {images.map((img, idx) => (
          <div
            key={img.id}
            className="group relative aspect-[3/4] bg-slate-100 border border-slate-200 rounded-lg overflow-hidden"
          >
            <img
              src={img.url}
              alt={img.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-mono-num font-semibold bg-slate-900/80 text-white rounded">
              {idx + 1}
            </div>

            <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 absolute inset-x-1 bottom-1 flex items-center justify-between gap-1">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleSwapImages(idx, idx - 1)}
                  title="Move left"
                  aria-label={`Move photo ${idx + 1} left`}
                  className="min-h-[30px] min-w-[28px] lg:min-h-0 lg:min-w-0 p-1 bg-white/95 text-slate-800 rounded shadow-xs disabled:opacity-35 cursor-pointer disabled:cursor-default flex items-center justify-center"
                >
                  <ArrowLeft className="w-3.5 h-3.5 lg:w-3 lg:h-3" />
                </button>
                <button
                  type="button"
                  disabled={idx === images.length - 1}
                  onClick={() => handleSwapImages(idx, idx + 1)}
                  title="Move right"
                  aria-label={`Move photo ${idx + 1} right`}
                  className="min-h-[30px] min-w-[28px] lg:min-h-0 lg:min-w-0 p-1 bg-white/95 text-slate-800 rounded shadow-xs disabled:opacity-35 cursor-pointer disabled:cursor-default flex items-center justify-center"
                >
                  <ArrowRight className="w-3.5 h-3.5 lg:w-3 lg:h-3" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                title="Remove"
                aria-label={`Remove photo ${idx + 1}`}
                className="min-h-[30px] min-w-[28px] lg:min-h-0 lg:min-w-0 p-1 bg-white/95 hover:bg-red-600 hover:text-white text-slate-800 rounded shadow-xs cursor-pointer transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5 lg:w-3 lg:h-3" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleTriggerFilePicker}
          className="aspect-[3/4] border border-dashed border-slate-300 hover:border-[#A90D18] hover:bg-slate-50 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-[#A90D18] transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs font-medium">Add</span>
        </button>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Top Navigation Bar (compact static on mobile to keep sticky height <10%, sticky on desktop) */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-10 h-14 lg:h-16 flex items-center justify-between gap-4 lg:gap-8 lg:sticky lg:top-0 z-30">
        <a
          href="#top"
          className="text-lg font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span
            className="font-editorial text-xl font-semibold tracking-[-0.03em]"
            style={{ color: '#A90D18' }}
          >
            Maximalism
          </span>
          <span className="text-slate-400 font-normal text-sm">Studio</span>
        </a>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#templates-section" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Templates
          </a>
          <a href="#canvas-stage" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Canvas
          </a>
          <a href="#queue-strip" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Images
          </a>
          <button
            type="button"
            onClick={handleLoadSamples}
            disabled={isLoadingSamples}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            Sample Posters
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTriggerFilePicker}
            className="min-h-[40px] inline-flex items-center gap-2 px-3.5 lg:px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ImagePlus className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
            <span>Upload</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace (pb-24 on mobile for fixed bottom thumb bar) */}
      <main id="top" className="flex-1 w-full max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-10 pt-4 pb-24 lg:py-8">
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 lg:mb-6 flex items-center justify-between gap-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center hover:bg-red-100 rounded transition-colors cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Desktop Template Picker (hidden on mobile; mobile shows it in the Templates tab below the canvas) */}
        <div className="hidden lg:block">
          <TemplateSelector
            selectedTemplate={config.templateId}
            onSelectTemplate={handleSelectTemplate}
          />
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-5 lg:gap-8">
          {/* Canvas Stage */}
          <div id="canvas-stage" className="flex-1 w-full min-w-0 flex flex-col items-center">
            {/* Compact Workspace Action Row */}
            <div className="w-full max-w-[640px] mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
                <span className="font-semibold text-slate-900 font-mono-num whitespace-nowrap">
                  {images.length} {images.length === 1 ? 'Photo' : 'Photos'}
                </span>
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <span className="hidden sm:inline truncate">
                  {config.templateId === 'editorial-wall'
                    ? images.length === 0
                      ? 'Maximalism Poster Wall'
                      : images.length === 1
                      ? 'Centered single layout'
                      : images.length === 2
                      ? 'Left & right split'
                      : images.length === 6
                      ? 'Signature 6-poster stagger'
                      : 'Dynamic N-image editorial grid'
                    : config.templateId === 'top-bottom-center'
                    ? 'Top & bottom split · Center text'
                    : config.templateId === 'left-right-center'
                    ? 'Left & right split · Center text'
                    : config.templateId === 'quad-center-badge'
                    ? '2×2 Quad · Bold framed badge'
                    : '2×2 Quad · Clean center bar'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleTriggerFilePicker}
                  className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
                {images.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleLoadSamples}
                    disabled={isLoadingSamples}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#A90D18] bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Sample
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:text-red-700 hover:border-red-200 hover:bg-red-50/50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Live Artboard Preview */}
            <CollagePreview
              images={images}
              config={config}
              onAddFiles={handleAddFiles}
              onLoadSamples={handleLoadSamples}
              onRemoveImage={handleRemoveImage}
              onSwapImages={handleSwapImages}
              onUpdateImageTransform={handleUpdateImageTransform}
              onResetImageTransform={handleResetImageTransform}
              onTriggerFilePicker={handleTriggerFilePicker}
              isLoadingSamples={isLoadingSamples}
            />

            {/* Desktop Filmstrip (shown directly below canvas on lg+) */}
            {images.length > 0 && (
              <div className="hidden lg:block w-full max-w-[640px] mt-6">
                {renderPhotoSequence()}
              </div>
            )}
          </div>

          {/* Mobile Active Tab Panel (one clean focused panel right under canvas) */}
          <div className="w-full max-w-[640px] mx-auto lg:hidden">
            {mobileTab === 'templates' && (
              <TemplateSelector
                selectedTemplate={config.templateId}
                onSelectTemplate={handleSelectTemplate}
              />
            )}

            {mobileTab === 'photos' && renderPhotoSequence()}

            {mobileTab === 'text' && (
              <ControlSidebar
                imageCount={images.length}
                config={config}
                resolution={resolution}
                format={format}
                compression={compression}
                cloudinarySafe={cloudinarySafe}
                isExporting={isExporting}
                exportSuccess={exportSuccess}
                visibleSections="text-layout"
                onChangeConfig={handleChangeConfig}
                onChangeResolution={setResolution}
                onChangeFormat={setFormat}
                onChangeCompression={setCompression}
                onChangeCloudinarySafe={setCloudinarySafe}
                onExport={handleExport}
                onResetSettings={handleResetSettings}
              />
            )}

            {mobileTab === 'export' && (
              <ControlSidebar
                imageCount={images.length}
                config={config}
                resolution={resolution}
                format={format}
                compression={compression}
                cloudinarySafe={cloudinarySafe}
                isExporting={isExporting}
                exportSuccess={exportSuccess}
                visibleSections="export"
                onChangeConfig={handleChangeConfig}
                onChangeResolution={setResolution}
                onChangeFormat={setFormat}
                onChangeCompression={setCompression}
                onChangeCloudinarySafe={setCloudinarySafe}
                onExport={handleExport}
                onResetSettings={handleResetSettings}
              />
            )}
          </div>

          {/* Desktop Right Studio Control Panel */}
          <div className="hidden lg:block">
            <ControlSidebar
              imageCount={images.length}
              config={config}
              resolution={resolution}
              format={format}
              compression={compression}
              cloudinarySafe={cloudinarySafe}
              isExporting={isExporting}
              exportSuccess={exportSuccess}
              visibleSections="all"
              onChangeConfig={handleChangeConfig}
              onChangeResolution={setResolution}
              onChangeFormat={setFormat}
              onChangeCompression={setCompression}
              onChangeCloudinarySafe={setCloudinarySafe}
              onExport={handleExport}
              onResetSettings={handleResetSettings}
            />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Thumb Bar (4 clean tabs, <= 60px height) */}
      <nav
        aria-label="Mobile studio navigation"
        className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200"
      >
        <div className="grid grid-cols-4 h-[60px]">
          {(
            [
              { id: 'templates', label: 'Templates', icon: LayoutGrid },
              { id: 'photos', label: `Photos${images.length ? ` (${images.length})` : ''}`, icon: Images },
              { id: 'text', label: 'Text & Fit', icon: Type },
              { id: 'export', label: 'Save HD', icon: Download },
            ] as { id: MobileTab; label: string; icon: React.ComponentType<{ className?: string }> }[]
          ).map((tab) => {
            const Icon = tab.icon;
            const active = mobileTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobileTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  active ? 'text-[#A90D18]' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
