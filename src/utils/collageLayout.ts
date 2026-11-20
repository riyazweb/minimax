import { CollageConfig, CollageLayoutResult, FitMode, PosterSlot, UploadedImage } from '../types/collage';

function getAspectRatio(img: UploadedImage | undefined, fitMode: FitMode, fallback = 0.74): number {
  if (!img) return fallback;
  if (fitMode === 'square') return 1;
  if (fitMode === 'original') {
    const raw = img.width / Math.max(1, img.height);
    return Math.max(0.38, Math.min(2.4, raw));
  }
  return fallback;
}

function fitAndCenterSlots(
  rawSlots: PosterSlot[],
  availX: number,
  availY: number,
  availW: number,
  availH: number
): PosterSlot[] {
  if (rawSlots.length === 0) return [];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const s of rawSlots) {
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x + s.width);
    maxY = Math.max(maxY, s.y + s.height);
  }

  const rawW = Math.max(1, maxX - minX);
  const rawH = Math.max(1, maxY - minY);
  const scale = Math.min(availW / rawW, availH / rawH);

  const finalW = rawW * scale;
  const finalH = rawH * scale;
  const offsetX = availX + (availW - finalW) / 2 - minX * scale;
  const offsetY = availY + (availH - finalH) / 2 - minY * scale;

  return rawSlots.map((s) => ({
    imageIndex: s.imageIndex,
    x: s.x * scale + offsetX,
    y: s.y * scale + offsetY,
    width: s.width * scale,
    height: s.height * scale,
  }));
}

export function getCanvasDimensions(
  aspect: CollageConfig['canvasAspect'],
  baseWidth: number
): { width: number; height: number } {
  switch (aspect) {
    case '4:5':
      return { width: baseWidth, height: Math.round(baseWidth * 1.25) };
    case '3:4':
      return { width: baseWidth, height: Math.round((baseWidth * 4) / 3) };
    case '1:1':
    default:
      return { width: baseWidth, height: baseWidth };
  }
}

function computeEditorialWallSlots(
  images: UploadedImage[],
  config: CollageConfig,
  canvasWidth: number,
  canvasHeight: number,
  topStart: number,
  bottomPad: number
): { slots: PosterSlot[]; layoutLabel: string } {
  const sidePad = canvasWidth * 0.112;
  const availW = canvasWidth - sidePad * 2;
  const availH = canvasHeight - topStart - bottomPad;

  const n = images.length;
  const isStaggered = config.layoutStyle === 'staggered';
  const effectiveGapScale = Math.max(0.4, config.gapScale);

  if (n === 1) {
    const ratio = getAspectRatio(images[0], config.fitMode, 0.74);
    const maxW = availW * 0.72;
    const maxH = availH * 0.88;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    return {
      slots: [
        {
          imageIndex: 0,
          x: (canvasWidth - w) / 2,
          y: topStart + (availH - h) / 2,
          width: w,
          height: h,
        },
      ],
      layoutLabel: '1 Image · Centered',
    };
  }

  if (n === 2) {
    const rawGap = 24 * effectiveGapScale;
    const colW = 360;
    const r0 = getAspectRatio(images[0], config.fitMode, 0.74);
    const r1 = getAspectRatio(images[1], config.fitMode, 0.74);
    const h0 = colW / r0;
    const h1 = colW / r1;
    const maxH = Math.max(h0, h1);

    const rawSlots: PosterSlot[] = [
      { imageIndex: 0, x: 0, y: (maxH - h0) / 2, width: colW, height: h0 },
      { imageIndex: 1, x: colW + rawGap, y: (maxH - h1) / 2, width: colW, height: h1 },
    ];
    return {
      slots: fitAndCenterSlots(rawSlots, sidePad, topStart + availH * 0.06, availW, availH * 0.84),
      layoutLabel: '2 Images · Left & Right',
    };
  }

  if (n === 3) {
    const rawGap = 18 * effectiveGapScale;
    const widths = isStaggered ? [240, 268, 232] : [250, 250, 250];
    const yOffsets = isStaggered ? [46, 0, 58] : [0, 0, 0];
    let curX = 0;
    const rawSlots: PosterSlot[] = [];

    for (let i = 0; i < 3; i++) {
      const ratio = getAspectRatio(images[i], config.fitMode, 0.72);
      const w = widths[i];
      const h = w / ratio;
      rawSlots.push({ imageIndex: i, x: curX, y: yOffsets[i], width: w, height: h });
      curX += w + rawGap;
    }

    return {
      slots: fitAndCenterSlots(rawSlots, sidePad, topStart + availH * 0.04, availW, availH * 0.88),
      layoutLabel: isStaggered ? '3 Images · Editorial Trio' : '3 Images · Aligned Row',
    };
  }

  if (n === 4) {
    const rawGap = 18 * effectiveGapScale;
    const colW = 280;
    const colY = isStaggered ? [0, 44] : [0, 0];
    const colX = [0, colW + rawGap];
    const rawSlots: PosterSlot[] = [];

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const ratio = getAspectRatio(images[i], config.fitMode, 0.74);
      const h = colW / ratio;
      rawSlots.push({ imageIndex: i, x: colX[col], y: colY[col], width: colW, height: h });
      colY[col] += h + rawGap;
    }

    return {
      slots: fitAndCenterSlots(rawSlots, sidePad, topStart, availW, availH),
      layoutLabel: isStaggered ? '4 Images · Staggered Grid' : '4 Images · Aligned 2×2',
    };
  }

  if (n === 5) {
    const rawGap = 18 * effectiveGapScale;
    const topWidths = isStaggered ? [238, 264, 226] : [245, 245, 245];
    const topOffsets = isStaggered ? [46, 0, 56] : [0, 0, 0];
    const rawSlots: PosterSlot[] = [];

    let curX = 0;
    let maxTopBottom = 0;
    for (let i = 0; i < 3; i++) {
      const ratio = getAspectRatio(images[i], config.fitMode, 0.73);
      const w = topWidths[i];
      const h = w / ratio;
      rawSlots.push({ imageIndex: i, x: curX, y: topOffsets[i], width: w, height: h });
      maxTopBottom = Math.max(maxTopBottom, topOffsets[i] + h);
      curX += w + rawGap;
    }

    const totalTopW = curX - rawGap;
    const botW = 248;
    const botPairW = botW * 2 + rawGap;
    const botStartX = (totalTopW - botPairW) / 2;
    const botY = maxTopBottom + rawGap;

    for (let j = 0; j < 2; j++) {
      const idx = 3 + j;
      const ratio = getAspectRatio(images[idx], config.fitMode, 0.73);
      const h = botW / ratio;
      rawSlots.push({
        imageIndex: idx,
        x: botStartX + j * (botW + rawGap),
        y: botY + (isStaggered && j === 1 ? 14 : 0),
        width: botW,
        height: h,
      });
    }

    return {
      slots: fitAndCenterSlots(rawSlots, sidePad, topStart, availW, availH),
      layoutLabel: isStaggered ? '5 Images · 3 + 2 Editorial' : '5 Images · Balanced Grid',
    };
  }

  if (n === 6) {
    const rawGap = 17 * effectiveGapScale;
    const colWidths = isStaggered ? [237, 264, 218] : [242, 242, 242];
    const colStartOffsets = isStaggered ? [56, 0, 68] : [0, 0, 0];
    const posterRatios = [0.725, 0.755, 0.67, 0.68, 0.77, 0.68];

    const colX = [0, colWidths[0] + rawGap, colWidths[0] + colWidths[1] + rawGap * 2];
    const colY = [...colStartOffsets];
    const rawSlots: PosterSlot[] = [];

    for (let i = 0; i < 6; i++) {
      const col = i % 3;
      const w = colWidths[col];
      const ratio = getAspectRatio(images[i], config.fitMode, posterRatios[i]);
      const h = w / ratio;
      rawSlots.push({ imageIndex: i, x: colX[col], y: colY[col], width: w, height: h });
      colY[col] += h + rawGap;
    }

    return {
      slots: fitAndCenterSlots(rawSlots, sidePad, topStart, availW, availH),
      layoutLabel: isStaggered ? '6 Images · Maximalism Reference' : '6 Images · Aligned 3×2',
    };
  }

  // n > 6
  const cols = n <= 9 ? 3 : n <= 16 ? 4 : 5;
  const rawGap = Math.max(10, 17 - Math.floor((n - 6) * 0.4)) * effectiveGapScale;

  const colWidths: number[] = [];
  for (let c = 0; c < cols; c++) {
    const distFromCenter = Math.abs(c - (cols - 1) / 2);
    const weight = isStaggered ? (distFromCenter < 0.6 ? 1.08 : 0.97) : 1.0;
    colWidths.push(240 * weight);
  }

  const colX: number[] = [];
  let accX = 0;
  for (let c = 0; c < cols; c++) {
    colX.push(accX);
    accX += colWidths[c] + rawGap;
  }

  const colY: number[] = [];
  for (let c = 0; c < cols; c++) {
    if (!isStaggered) {
      colY.push(0);
    } else {
      const distFromCenter = Math.abs(c - (cols - 1) / 2);
      const asym = c > (cols - 1) / 2 ? 12 : 0;
      colY.push(distFromCenter * 48 + asym);
    }
  }

  const rawSlots: PosterSlot[] = [];
  for (let i = 0; i < n; i++) {
    let targetCol = 0;
    if (i < cols) {
      targetCol = i;
    } else {
      let minColBottom = Infinity;
      for (let c = 0; c < cols; c++) {
        if (colY[c] < minColBottom) {
          minColBottom = colY[c];
          targetCol = c;
        }
      }
    }

    const w = colWidths[targetCol];
    const ratio = getAspectRatio(images[i], config.fitMode, 0.74);
    const h = w / ratio;

    rawSlots.push({ imageIndex: i, x: colX[targetCol], y: colY[targetCol], width: w, height: h });
    colY[targetCol] += h + rawGap;
  }

  return {
    slots: fitAndCenterSlots(rawSlots, sidePad, topStart, availW, availH),
    layoutLabel: `${n} Images · ${cols}-Col ${isStaggered ? 'Stagger' : 'Grid'}`,
  };
}

function computeQuadGridSlots(
  n: number,
  canvasWidth: number,
  canvasHeight: number,
  gap: number
): { slots: PosterSlot[]; layoutLabel: string } {
  if (n === 1) {
    return {
      slots: [{ imageIndex: 0, x: 0, y: 0, width: canvasWidth, height: canvasHeight }],
      layoutLabel: '1 Image · Full Frame',
    };
  }

  if (n === 2) {
    const halfW = (canvasWidth - gap) / 2;
    return {
      slots: [
        { imageIndex: 0, x: 0, y: 0, width: halfW, height: canvasHeight },
        { imageIndex: 1, x: halfW + gap, y: 0, width: halfW, height: canvasHeight },
      ],
      layoutLabel: '2 Images · Vertical Split',
    };
  }

  if (n === 3) {
    const halfH = (canvasHeight - gap) / 2;
    const halfW = (canvasWidth - gap) / 2;
    return {
      slots: [
        { imageIndex: 0, x: 0, y: 0, width: canvasWidth, height: halfH },
        { imageIndex: 1, x: 0, y: halfH + gap, width: halfW, height: halfH },
        { imageIndex: 2, x: halfW + gap, y: halfH + gap, width: halfW, height: halfH },
      ],
      layoutLabel: '3 Images · 1 + 2 Split',
    };
  }

  if (n === 4) {
    const halfW = (canvasWidth - gap) / 2;
    const halfH = (canvasHeight - gap) / 2;
    return {
      slots: [
        { imageIndex: 0, x: 0, y: 0, width: halfW, height: halfH },
        { imageIndex: 1, x: halfW + gap, y: 0, width: halfW, height: halfH },
        { imageIndex: 2, x: 0, y: halfH + gap, width: halfW, height: halfH },
        { imageIndex: 3, x: halfW + gap, y: halfH + gap, width: halfW, height: halfH },
      ],
      layoutLabel: '4 Images · 2×2 Quad',
    };
  }

  // n >= 5: full-bleed multi-row grid where last row expands cleanly to fill full width
  const cols = n <= 6 ? 3 : n <= 8 ? 4 : Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const rowH = (canvasHeight - gap * (rows - 1)) / rows;
  const slots: PosterSlot[] = [];

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    const itemsInRow = r === rows - 1 ? n - idx : cols;
    const cellW = (canvasWidth - gap * (itemsInRow - 1)) / itemsInRow;
    const y = r * (rowH + gap);
    for (let c = 0; c < itemsInRow; c++) {
      slots.push({
        imageIndex: idx,
        x: c * (cellW + gap),
        y,
        width: cellW,
        height: rowH,
      });
      idx++;
    }
  }

  return {
    slots,
    layoutLabel: `${n} Images · Full-Bleed Grid`,
  };
}

function computeTopBottomSlots(
  n: number,
  canvasWidth: number,
  canvasHeight: number,
  gap: number
): { slots: PosterSlot[]; layoutLabel: string } {
  if (n === 1) {
    return {
      slots: [{ imageIndex: 0, x: 0, y: 0, width: canvasWidth, height: canvasHeight }],
      layoutLabel: '1 Image · Center Overlay',
    };
  }

  const topCount = Math.ceil(n / 2);
  const bottomCount = n - topCount;
  const halfH = (canvasHeight - gap) / 2;
  const slots: PosterSlot[] = [];

  const topCellW = (canvasWidth - gap * (topCount - 1)) / topCount;
  for (let i = 0; i < topCount; i++) {
    slots.push({
      imageIndex: i,
      x: i * (topCellW + gap),
      y: 0,
      width: topCellW,
      height: halfH,
    });
  }

  const botCellW = (canvasWidth - gap * (bottomCount - 1)) / bottomCount;
  for (let j = 0; j < bottomCount; j++) {
    slots.push({
      imageIndex: topCount + j,
      x: j * (botCellW + gap),
      y: halfH + gap,
      width: botCellW,
      height: halfH,
    });
  }

  return {
    slots,
    layoutLabel: n === 2 ? '2 Images · Top & Down' : `${n} Images · Top / Down Split`,
  };
}

function computeLeftRightSlots(
  n: number,
  canvasWidth: number,
  canvasHeight: number,
  gap: number
): { slots: PosterSlot[]; layoutLabel: string } {
  if (n === 1) {
    return {
      slots: [{ imageIndex: 0, x: 0, y: 0, width: canvasWidth, height: canvasHeight }],
      layoutLabel: '1 Image · Center Overlay',
    };
  }

  const leftCount = Math.ceil(n / 2);
  const rightCount = n - leftCount;
  const halfW = (canvasWidth - gap) / 2;
  const slots: PosterSlot[] = [];

  const leftCellH = (canvasHeight - gap * (leftCount - 1)) / leftCount;
  for (let i = 0; i < leftCount; i++) {
    slots.push({
      imageIndex: i,
      x: 0,
      y: i * (leftCellH + gap),
      width: halfW,
      height: leftCellH,
    });
  }

  const rightCellH = (canvasHeight - gap * (rightCount - 1)) / rightCount;
  for (let j = 0; j < rightCount; j++) {
    slots.push({
      imageIndex: leftCount + j,
      x: halfW + gap,
      y: j * (rightCellH + gap),
      width: halfW,
      height: rightCellH,
    });
  }

  return {
    slots,
    layoutLabel: n === 2 ? '2 Images · Left & Right' : `${n} Images · Left / Right Split`,
  };
}

export function computeCollageLayout(
  images: UploadedImage[],
  config: CollageConfig,
  baseWidth = 1000
): CollageLayoutResult {
  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions(config.canvasAspect, baseWidth);
  const outerRadius = (config.cornerRadius / 1000) * canvasWidth;

  if (config.templateId === 'editorial-wall') {
    const titleFontSize = canvasWidth * 0.073 * config.titleScale;
    const hasTitle = config.showTitle && config.title.trim().length > 0;
    const titleY = canvasWidth * 0.118 + Math.max(0, config.titleScale - 1) * canvasWidth * 0.032;
    const topStart = hasTitle ? titleY + titleFontSize * 0.62 : canvasHeight * 0.065;
    const bottomPad = canvasHeight * 0.065;

    const { slots, layoutLabel } =
      images.length === 0
        ? { slots: [], layoutLabel: 'Empty Canvas' }
        : computeEditorialWallSlots(images, config, canvasWidth, canvasHeight, topStart, bottomPad);

    return {
      canvasWidth,
      canvasHeight,
      titleMode: 'top-editorial',
      titleY,
      titleFontSize,
      outerRadius,
      slots,
      layoutLabel,
    };
  }

  // Full-bleed center-text templates (quad-center-bar, quad-center-badge, top-bottom-center, left-right-center)
  const splitGap = config.gapScale <= 0.05 ? 0 : canvasWidth * 0.008 * config.gapScale;
  const titleFontSize = canvasWidth * 0.048 * config.titleScale;
  const titleY = canvasHeight / 2;
  const titleMode = config.templateId === 'quad-center-badge' ? 'center-badge' : 'center-bar';

  if (images.length === 0) {
    return {
      canvasWidth,
      canvasHeight,
      titleMode,
      titleY,
      titleFontSize,
      outerRadius,
      slots: [],
      layoutLabel: 'Empty Canvas',
    };
  }

  let result: { slots: PosterSlot[]; layoutLabel: string };
  if (config.templateId === 'top-bottom-center') {
    result = computeTopBottomSlots(images.length, canvasWidth, canvasHeight, splitGap);
  } else if (config.templateId === 'left-right-center') {
    result = computeLeftRightSlots(images.length, canvasWidth, canvasHeight, splitGap);
  } else {
    result = computeQuadGridSlots(images.length, canvasWidth, canvasHeight, splitGap);
  }

  return {
    canvasWidth,
    canvasHeight,
    titleMode,
    titleY,
    titleFontSize,
    outerRadius,
    slots: result.slots,
    layoutLabel: result.layoutLabel,
  };
}
