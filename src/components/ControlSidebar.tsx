import React from 'react';
import { Download, RotateCcw } from 'lucide-react';
import {
  CanvasAspect,
  CollageConfig,
  ExportCompression,
  ExportFormat,
  ExportResolution,
  FitMode,
  LayoutStyle,
  TitleFontFamily,
} from '../types/collage';
import { getCanvasDimensions } from '../utils/collageLayout';

interface ControlSidebarProps {
  imageCount: number;
  config: CollageConfig;
  resolution: ExportResolution;
  format: ExportFormat;
  compression: ExportCompression;
  cloudinarySafe: boolean;
  isExporting: boolean;
  exportSuccess: string | null;
  visibleSections?: 'all' | 'text-layout' | 'export';
  onChangeConfig: <K extends keyof CollageConfig>(key: K, value: CollageConfig[K]) => void;
  onChangeResolution: (res: ExportResolution) => void;
  onChangeFormat: (fmt: ExportFormat) => void;
  onChangeCompression: (comp: ExportCompression) => void;
  onChangeCloudinarySafe: (safe: boolean) => void;
  onExport: () => void;
  onResetSettings: () => void;
}

const ACCENT_PRESETS = [
  { label: 'Maximalism Crimson', hex: '#A90D18' },
  { label: 'Editorial Ink', hex: '#111827' },
  { label: 'Gallery Cobalt', hex: '#1D4ED8' },
  { label: 'Archive Forest', hex: '#14532D' },
];

const FONT_OPTIONS: TitleFontFamily[] = [
  'Playfair Display',
  'Plus Jakarta Sans',
  'Cormorant Garamond',
  'Bodoni Moda',
];

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
  imageCount,
  config,
  resolution,
  format,
  compression,
  cloudinarySafe,
  isExporting,
  exportSuccess,
  visibleSections = 'all',
  onChangeConfig,
  onChangeResolution,
  onChangeFormat,
  onChangeCompression,
  onChangeCloudinarySafe,
  onExport,
  onResetSettings,
}) => {
  const exportDims = getCanvasDimensions(config.canvasAspect, resolution);
  const isEditorialWall = config.templateId === 'editorial-wall';
  const isCenterBadge = config.templateId === 'quad-center-badge';

  const showTextAndLayout = visibleSections === 'all' || visibleSections === 'text-layout';
  const showExport = visibleSections === 'all' || visibleSections === 'export';

  return (
    <aside className="w-full lg:w-[360px] shrink-0 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 lg:p-6 flex flex-col gap-5 lg:gap-6">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            {visibleSections === 'export'
              ? 'Export HD Collage'
              : visibleSections === 'text-layout'
              ? 'Text & Layout'
              : 'Studio Controls'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {visibleSections === 'export'
              ? 'Choose resolution & download crisp file'
              : 'Customize typography, spacing & framing'}
          </p>
        </div>
        {showTextAndLayout && (
          <button
            type="button"
            onClick={onResetSettings}
            className="min-h-[36px] inline-flex items-center gap-1.5 px-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {showTextAndLayout && (
        <>
          {/* 01. Headline / Center Text */}
          <section className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">
                {isEditorialWall ? '01. Top Headline' : '01. Center Banner Text'}
              </span>
              <label className="min-h-[36px] inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showTitle}
                  onChange={(e) => onChangeConfig('showTitle', e.target.checked)}
                  className="w-4 h-4 accent-[#A90D18] rounded cursor-pointer"
                />
                Visible
              </label>
            </div>

            <div className={isCenterBadge ? 'grid grid-cols-[76px_1fr] gap-2' : 'block'}>
              {isCenterBadge && (
                <input
                  type="text"
                  value={config.badgeTag}
                  onChange={(e) => onChangeConfig('badgeTag', e.target.value)}
                  disabled={!config.showTitle}
                  placeholder="01"
                  maxLength={4}
                  aria-label="Badge tag"
                  className="w-full min-h-[44px] px-2.5 py-2 text-base sm:text-sm text-center font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#A90D18] disabled:bg-slate-50 disabled:text-slate-400"
                />
              )}
              <input
                type="text"
                value={config.title}
                onChange={(e) => onChangeConfig('title', e.target.value)}
                disabled={!config.showTitle}
                placeholder={isEditorialWall ? 'Maximalism' : 'Center banner text'}
                maxLength={48}
                className="w-full min-h-[44px] px-3 py-2 text-base sm:text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#A90D18] disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <label className="text-xs text-slate-500">Typeface</label>
              <select
                value={config.titleFont}
                onChange={(e) => onChangeConfig('titleFont', e.target.value as TitleFontFamily)}
                disabled={!config.showTitle}
                className="w-full min-h-[44px] px-3 py-2 text-base sm:text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#A90D18] disabled:bg-slate-50"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                {isCenterBadge ? 'Badge Accent' : 'Text Color'}
              </span>
              <div className="flex items-center gap-2.5">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    title={preset.label}
                    onClick={() => onChangeConfig('titleColor', preset.hex)}
                    className={`w-8 h-8 lg:w-6 lg:h-6 rounded-full border transition-transform cursor-pointer ${
                      config.titleColor.toLowerCase() === preset.hex.toLowerCase()
                        ? 'scale-110 ring-2 ring-offset-2 ring-slate-900 border-white'
                        : 'border-slate-200 hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    aria-label={preset.label}
                  />
                ))}
                <input
                  type="color"
                  value={config.titleColor}
                  onChange={(e) => onChangeConfig('titleColor', e.target.value)}
                  title="Custom hex color"
                  className="w-9 h-8 lg:w-7 lg:h-6 p-0 border border-slate-200 rounded cursor-pointer bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 py-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Text Size</span>
                <span className="font-mono-num text-slate-700">{Math.round(config.titleScale * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.05}
                value={config.titleScale}
                onChange={(e) => onChangeConfig('titleScale', parseFloat(e.target.value))}
                className="studio-slider w-full"
              />
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 02. Layout & Framing */}
          <section className="flex flex-col gap-3.5">
            <span className="text-xs font-semibold text-slate-900">02. Layout &amp; Framing</span>

            {isEditorialWall && (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-slate-500">Composition</span>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                    {(['staggered', 'aligned'] as LayoutStyle[]).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => onChangeConfig('layoutStyle', style)}
                        className={`min-h-[40px] lg:min-h-[32px] px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          config.layoutStyle === style
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {style === 'staggered' ? 'Editorial Stagger' : 'Aligned Grid'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-slate-500">Image Aspect</span>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                    {(
                      [
                        { value: 'poster', label: 'Poster 3:4' },
                        { value: 'original', label: 'Original' },
                        { value: 'square', label: 'Square 1:1' },
                      ] as { value: FitMode; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChangeConfig('fitMode', opt.value)}
                        className={`min-h-[40px] lg:min-h-[32px] px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          config.fitMode === opt.value
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-500">Canvas Ratio</span>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                {(['1:1', '4:5', '3:4'] as CanvasAspect[]).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => onChangeConfig('canvasAspect', ratio)}
                    className={`min-h-[40px] lg:min-h-[32px] px-2 py-1.5 text-xs font-mono-num font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      config.canvasAspect === ratio
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 py-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Gap Spacing</span>
                <span className="font-mono-num text-slate-700">{config.gapScale.toFixed(1)}×</span>
              </div>
              <input
                type="range"
                min={isEditorialWall ? 0.5 : 0}
                max={1.8}
                step={0.1}
                value={config.gapScale}
                onChange={(e) => onChangeConfig('gapScale', parseFloat(e.target.value))}
                className="studio-slider w-full"
              />
            </div>

            {!isEditorialWall && (
              <div className="flex flex-col gap-2 py-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Outer Corner Radius</span>
                  <span className="font-mono-num text-slate-700">{config.cornerRadius}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={2}
                  value={config.cornerRadius}
                  onChange={(e) => onChangeConfig('cornerRadius', parseInt(e.target.value, 10))}
                  className="studio-slider w-full"
                />
              </div>
            )}
          </section>
        </>
      )}

      {visibleSections === 'all' && <hr className="border-slate-100" />}

      {showExport && (
        /* 03. HD Export */
        <section className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900">
              {visibleSections === 'export' ? 'Resolution & Format' : '03. HD Export'}
            </span>
            <span className="text-xs font-mono-num text-slate-500">
              {exportDims.width} × {exportDims.height} px
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { value: 2048, label: '2K HD' },
                { value: 3200, label: '3.2K UHD' },
                { value: 4096, label: '4K Print' },
              ] as { value: ExportResolution; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangeResolution(opt.value)}
                className={`min-h-[42px] lg:min-h-[32px] px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  resolution === opt.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { value: 'webp', label: 'WebP Small' },
                { value: 'jpeg', label: 'JPG HD' },
                { value: 'png', label: 'PNG Raw' },
              ] as { value: ExportFormat; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangeFormat(opt.value)}
                className={`min-h-[42px] lg:min-h-[32px] px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  format === opt.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {format !== 'png' && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { value: 'compact', label: 'Compact HD' },
                  { value: 'high', label: 'Max Detail' },
                ] as { value: ExportCompression; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChangeCompression(opt.value)}
                  className={`min-h-[40px] lg:min-h-[30px] px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    compression === opt.value
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <label className="min-h-[36px] flex items-center justify-between gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <span>Cloudinary Safe (&lt; 9.5 MB cap)</span>
            <input
              type="checkbox"
              checked={cloudinarySafe}
              onChange={(e) => onChangeCloudinarySafe(e.target.checked)}
              className="w-4 h-4 accent-[#A90D18] rounded cursor-pointer"
            />
          </label>

          <button
            type="button"
            onClick={onExport}
            disabled={imageCount === 0 || isExporting}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#A90D18] hover:bg-[#8E0B14] disabled:bg-slate-200 disabled:text-slate-400 rounded-xl lg:rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Rendering HD Collage...' : 'Download HD Collage'}
          </button>

          {exportSuccess && (
            <p className="text-xs text-emerald-700 font-medium text-center">{exportSuccess}</p>
          )}
        </section>
      )}
    </aside>
  );
};
