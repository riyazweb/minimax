export type FocalAlign = 'center' | 'top' | 'bottom';

export interface UploadedImage {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  element: HTMLImageElement;
  focalAlign: FocalAlign;
  panX: number; // -1 to 1
  panY: number; // -1 to 1
  zoom: number; // 1 to 3
}

export type TemplateId =
  | 'editorial-wall'
  | 'quad-center-bar'
  | 'quad-center-badge'
  | 'top-bottom-center'
  | 'left-right-center';

export type CanvasAspect = '1:1' | '4:5' | '3:4';
export type FitMode = 'poster' | 'original' | 'square';
export type LayoutStyle = 'staggered' | 'aligned';
export type TitleFontFamily =
  | 'Playfair Display'
  | 'Cormorant Garamond'
  | 'Bodoni Moda'
  | 'Plus Jakarta Sans';
export type ExportFormat = 'png' | 'jpeg';
export type ExportResolution = 2048 | 3200 | 4096;

export interface CollageConfig {
  templateId: TemplateId;
  title: string;
  badgeTag: string;
  showTitle: boolean;
  titleColor: string;
  titleFont: TitleFontFamily;
  titleScale: number; // 0.75 to 1.3
  backgroundColor: string;
  canvasAspect: CanvasAspect;
  layoutStyle: LayoutStyle;
  fitMode: FitMode;
  gapScale: number; // 0 to 1.8
  cornerRadius: number; // 0 to 40 (normalized to 1000px base)
}

export interface PosterSlot {
  imageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollageLayoutResult {
  canvasWidth: number;
  canvasHeight: number;
  titleMode: 'top-editorial' | 'center-bar' | 'center-badge';
  titleY: number;
  titleFontSize: number;
  outerRadius: number;
  slots: PosterSlot[];
  layoutLabel: string;
}
