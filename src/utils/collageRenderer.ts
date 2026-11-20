import {
  CollageConfig,
  ExportCompression,
  ExportFormat,
  ExportResolution,
  UploadedImage,
} from '../types/collage';
import { computeCollageLayout } from './collageLayout';

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draws centered editorial serif text with consistent negative tracking across all browsers.
 */
function drawTrackedCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  fontSize: number,
  fontFamily: string,
  color: string,
  maxWidth: number
) {
  ctx.save();
  let effectiveSize = fontSize;
  const trackingRatio = -0.036;

  const measureTracked = (size: number): { totalW: number; charWidths: number[]; spacing: number } => {
    ctx.font = `600 ${size}px "${fontFamily}", Georgia, serif`;
    const spacing = size * trackingRatio;
    const chars = Array.from(text);
    const charWidths = chars.map((ch) => ctx.measureText(ch).width);
    const totalW = charWidths.reduce((acc, w) => acc + w, 0) + Math.max(0, chars.length - 1) * spacing;
    return { totalW, charWidths, spacing };
  };

  let metrics = measureTracked(effectiveSize);
  if (metrics.totalW > maxWidth && metrics.totalW > 0) {
    effectiveSize = effectiveSize * (maxWidth / metrics.totalW);
    metrics = measureTracked(effectiveSize);
  }

  ctx.font = `600 ${effectiveSize}px "${fontFamily}", Georgia, serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  let cursorX = centerX - metrics.totalW / 2;
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cursorX, y);
    cursorX += metrics.charWidths[i] + metrics.spacing;
  }
  ctx.restore();
}

/**
 * Draws the clean rectangular white center banner (matching left reference card).
 */
function drawCenterBarBanner(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  fontSize: number,
  fontFamily: string,
  textColor: string,
  maxCanvasWidth: number
) {
  ctx.save();
  const displayText = text.toUpperCase();
  let effectiveSize = fontSize;
  const padX = effectiveSize * 0.82;
  const maxBoxWidth = maxCanvasWidth * 0.94;

  ctx.font = `700 ${effectiveSize}px "${fontFamily}", "Plus Jakarta Sans", sans-serif`;
  let measuredW = ctx.measureText(displayText).width;
  if (measuredW + padX * 2 > maxBoxWidth && measuredW > 0) {
    const scale = (maxBoxWidth - padX * 2) / measuredW;
    effectiveSize *= scale;
    ctx.font = `700 ${effectiveSize}px "${fontFamily}", "Plus Jakarta Sans", sans-serif`;
    measuredW = ctx.measureText(displayText).width;
  }

  const boxPadX = effectiveSize * 0.85;
  const boxW = measuredW + boxPadX * 2;
  const boxH = effectiveSize * 1.92;
  const boxX = centerX - boxW / 2;
  const boxY = centerY - boxH / 2;

  ctx.shadowColor = 'rgba(15, 23, 42, 0.20)';
  ctx.shadowBlur = Math.max(8, effectiveSize * 0.55);
  ctx.shadowOffsetY = Math.max(2, effectiveSize * 0.14);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(boxX, boxY, boxW, boxH);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayText, centerX, centerY + effectiveSize * 0.04);
  ctx.restore();
}

/**
 * Draws the bold outlined capsule badge with optional circular prefix tag (matching right reference card).
 */
function drawCenterBadgeBanner(
  ctx: CanvasRenderingContext2D,
  text: string,
  badgeTag: string,
  centerX: number,
  centerY: number,
  fontSize: number,
  fontFamily: string,
  accentColor: string,
  maxCanvasWidth: number
) {
  ctx.save();
  const displayText = text.toUpperCase();
  const tag = badgeTag.trim();
  const hasTag = tag.length > 0;

  let effectiveSize = fontSize * 1.1;
  const maxBoxWidth = maxCanvasWidth * 0.94;

  const measureLayout = (size: number) => {
    ctx.font = `800 ${size}px "${fontFamily}", "Plus Jakarta Sans", sans-serif`;
    const textW = ctx.measureText(displayText).width;
    const pillH = size * 2.02;
    const circleD = hasTag ? pillH * 0.78 : 0;
    const gapAfterTag = hasTag ? size * 0.42 : 0;
    const sidePad = size * 0.7;
    const totalW = sidePad * 2 + (hasTag ? circleD + gapAfterTag : 0) + textW;
    return { textW, pillH, circleD, gapAfterTag, sidePad, totalW };
  };

  let metrics = measureLayout(effectiveSize);
  if (metrics.totalW > maxBoxWidth && metrics.totalW > 0) {
    effectiveSize *= maxBoxWidth / metrics.totalW;
    metrics = measureLayout(effectiveSize);
  }

  const boxW = metrics.totalW;
  const boxH = metrics.pillH;
  const boxX = centerX - boxW / 2;
  const boxY = centerY - boxH / 2;
  const strokeW = Math.max(2.5, effectiveSize * 0.14);

  // White capsule with bold dark outline
  ctx.shadowColor = 'rgba(15, 23, 42, 0.26)';
  ctx.shadowBlur = Math.max(10, effectiveSize * 0.5);
  ctx.shadowOffsetY = Math.max(2, effectiveSize * 0.12);

  drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, boxH / 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.lineWidth = strokeW;
  ctx.strokeStyle = '#0F172A';
  ctx.stroke();

  let textCenterX = centerX;

  if (hasTag) {
    const r = metrics.circleD / 2;
    const cx = boxX + metrics.sidePad * 0.72 + r;
    const cy = centerY;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, strokeW * 0.75);
    ctx.strokeStyle = '#0F172A';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${effectiveSize * 0.62}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, cx, cy + effectiveSize * 0.03);

    textCenterX = cx + r + metrics.gapAfterTag + metrics.textW / 2;
  }

  ctx.fillStyle = '#0F172A';
  ctx.font = `800 ${effectiveSize}px "${fontFamily}", "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayText, textCenterX, centerY + effectiveSize * 0.04);

  ctx.restore();
}

export function getPosterCropMetrics(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  panX: number,
  panY: number,
  zoom: number
) {
  const srcRatio = srcW / Math.max(1, srcH);
  const dstRatio = dstW / Math.max(1, dstH);
  const safeZoom = Math.max(1, Math.min(3, zoom || 1));

  let baseSw = srcW;
  let baseSh = srcH;
  if (srcRatio > dstRatio) {
    baseSw = srcH * dstRatio;
  } else if (srcRatio < dstRatio) {
    baseSh = srcW / dstRatio;
  }

  const sw = baseSw / safeZoom;
  const sh = baseSh / safeZoom;
  const maxShiftX = Math.max(0, (srcW - sw) / 2);
  const maxShiftY = Math.max(0, (srcH - sh) / 2);
  const clampedPanX = Math.max(-1, Math.min(1, panX || 0));
  const clampedPanY = Math.max(-1, Math.min(1, panY || 0));

  const sx = (srcW - sw) / 2 - clampedPanX * maxShiftX;
  const sy = (srcH - sh) / 2 - clampedPanY * maxShiftY;

  return { sx, sy, sw, sh, maxShiftX, maxShiftY };
}

/**
 * Draws an image into a rectangular slot with cover math, zoom, and free pan positioning.
 */
function drawPosterImage(
  ctx: CanvasRenderingContext2D,
  img: UploadedImage,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const el = img.element;
  if (!el || !el.complete || el.naturalWidth === 0) return;

  const { sx, sy, sw, sh } = getPosterCropMetrics(
    el.naturalWidth,
    el.naturalHeight,
    w,
    h,
    img.panX,
    img.panY,
    img.zoom
  );

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(el, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

export async function ensureEditorialFontLoaded(fontFamily: string): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load(`600 72px "${fontFamily}"`),
      document.fonts.load(`700 48px "Plus Jakarta Sans"`),
      document.fonts.load(`800 48px "Plus Jakarta Sans"`),
    ]);
  } catch {
    // Safe fallback if offline
  }
}

export async function renderCollageToCanvas(
  canvas: HTMLCanvasElement,
  images: UploadedImage[],
  config: CollageConfig,
  baseWidth: number,
  pixelRatio = 1
): Promise<void> {
  await ensureEditorialFontLoaded(config.titleFont);

  const layout = computeCollageLayout(images, config, baseWidth);
  const targetW = Math.round(layout.canvasWidth * pixelRatio);
  const targetH = Math.round(layout.canvasHeight * pixelRatio);

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Could not acquire 2D rendering context.');
  }

  ctx.save();
  ctx.scale(pixelRatio, pixelRatio);

  // 1. Crisp background fill
  ctx.fillStyle = config.backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, layout.canvasWidth, layout.canvasHeight);

  // 2. Render all image slots (optionally clipped to rounded outer frame for full-bleed templates)
  ctx.save();
  if (layout.outerRadius > 0) {
    drawRoundedRectPath(ctx, 0, 0, layout.canvasWidth, layout.canvasHeight, layout.outerRadius);
    ctx.clip();
  }

  for (const slot of layout.slots) {
    const img = images[slot.imageIndex];
    if (img) {
      drawPosterImage(ctx, img, slot.x, slot.y, slot.width, slot.height);
    }
  }
  ctx.restore();

  // 3. Render headline / center banner according to template mode
  if (config.showTitle && config.title.trim().length > 0) {
    const titleText = config.title.trim();
    if (layout.titleMode === 'center-bar') {
      drawCenterBarBanner(
        ctx,
        titleText,
        layout.canvasWidth / 2,
        layout.titleY,
        layout.titleFontSize,
        config.titleFont,
        config.titleColor,
        layout.canvasWidth
      );
    } else if (layout.titleMode === 'center-badge') {
      drawCenterBadgeBanner(
        ctx,
        titleText,
        config.badgeTag,
        layout.canvasWidth / 2,
        layout.titleY,
        layout.titleFontSize,
        config.titleFont,
        config.titleColor,
        layout.canvasWidth
      );
    } else {
      drawTrackedCenteredText(
        ctx,
        titleText,
        layout.canvasWidth / 2,
        layout.titleY,
        layout.titleFontSize,
        config.titleFont,
        config.titleColor,
        layout.canvasWidth * 0.94
      );
    }
  }

  ctx.restore();
}

const CLOUDINARY_SAFE_MAX_BYTES = 9.5 * 1024 * 1024; // 9.5 MB (under Cloudinary 10 MB limit)

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Canvas export returned an empty file.'));
      },
      mimeType,
      quality
    );
  });
}

export async function exportCollageHD(
  images: UploadedImage[],
  config: CollageConfig,
  resolution: ExportResolution,
  format: ExportFormat,
  compression: ExportCompression = 'compact',
  cloudinarySafe = true
): Promise<{
  width: number;
  height: number;
  fileName: string;
  fileSizeBytes: number;
  actualFormat: ExportFormat;
}> {
  if (images.length === 0) {
    throw new Error('Upload at least one image before exporting.');
  }

  const exportCanvas = document.createElement('canvas');
  await renderCollageToCanvas(exportCanvas, images, config, resolution, 1);

  const mimeFor = (fmt: ExportFormat) =>
    fmt === 'png' ? 'image/png' : fmt === 'webp' ? 'image/webp' : 'image/jpeg';

  let targetFormat: ExportFormat = format;
  let initialQuality = targetFormat === 'png' ? 1.0 : compression === 'compact' ? 0.86 : 0.92;
  let blob = await canvasToBlob(exportCanvas, mimeFor(targetFormat), initialQuality);

  // If browser doesn't support WebP canvas encoding and returned PNG, switch cleanly to JPEG
  if (targetFormat === 'webp' && blob.type === 'image/png') {
    targetFormat = 'jpeg';
    blob = await canvasToBlob(exportCanvas, 'image/jpeg', initialQuality);
  }

  // Enforce Cloudinary 10MB safe ceiling when enabled
  if (cloudinarySafe && blob.size > CLOUDINARY_SAFE_MAX_BYTES) {
    if (targetFormat === 'png') {
      // Lossless PNG exceeded 9.5 MB -> switch to sharp WebP (or JPEG fallback)
      targetFormat = 'webp';
      blob = await canvasToBlob(exportCanvas, 'image/webp', 0.90);
      if (blob.type === 'image/png') {
        targetFormat = 'jpeg';
        blob = await canvasToBlob(exportCanvas, 'image/jpeg', 0.90);
      }
    }

    if (blob.size > CLOUDINARY_SAFE_MAX_BYTES) {
      const steps = [0.82, 0.76, 0.70, 0.64, 0.56];
      for (const q of steps) {
        blob = await canvasToBlob(exportCanvas, mimeFor(targetFormat), q);
        if (blob.size <= CLOUDINARY_SAFE_MAX_BYTES) break;
      }
    }
  }

  const ext = targetFormat === 'png' ? 'png' : targetFormat === 'webp' ? 'webp' : 'jpg';
  const safeTitle =
    (config.title || 'maximalism-collage')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'maximalism-collage';
  const fileName = `${safeTitle}-${images.length}img-${exportCanvas.width}x${exportCanvas.height}.${ext}`;

  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  return {
    width: exportCanvas.width,
    height: exportCanvas.height,
    fileName,
    fileSizeBytes: blob.size,
    actualFormat: targetFormat,
  };
}
