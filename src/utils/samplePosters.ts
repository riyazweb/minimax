import { UploadedImage } from '../types/collage';
import { loadImageFromUrl } from './imageLoader';

interface PosterSpec {
  name: string;
  bg: string;
  accent1: string;
  accent2: string;
  ink: string;
  headline: string[];
  subline: string;
  motif: 'sunburst' | 'rings' | 'checker' | 'stripes' | 'editorial' | 'zigzag';
}

const SAMPLE_SPECS: PosterSpec[] = [
  {
    name: 'poster-01-create.png',
    bg: '#F4F1EA',
    accent1: '#FF5A1F',
    accent2: '#FACC15',
    ink: '#111827',
    headline: ['BE', 'SO', 'GOOD', 'NOW.'],
    subline: 'CREATE WITHOUT LIMITS',
    motif: 'sunburst',
  },
  {
    name: 'poster-02-pluralism.png',
    bg: '#121212',
    accent1: '#F59E0B',
    accent2: '#DC2626',
    ink: '#F8FAFC',
    headline: ['BOLD', 'FORM', 'ONLY'],
    subline: 'EDITION MMXXVI · STUDIO',
    motif: 'rings',
  },
  {
    name: 'poster-03-energy.png',
    bg: '#FF4D1C',
    accent1: '#2563EB',
    accent2: '#FDE047',
    ink: '#0F172A',
    headline: ['LIVE', '09/26', 'ALL', 'NIGHT'],
    subline: 'NO RULES · ONLY ENERGY',
    motif: 'checker',
  },
  {
    name: 'poster-04-type.png',
    bg: '#090D16',
    accent1: '#E11D48',
    accent2: '#38BDF8',
    ink: '#FFFFFF',
    headline: ['AT', 'CUS', '04'],
    subline: 'GRAPHIC ARCHIVE SERIES',
    motif: 'stripes',
  },
  {
    name: 'poster-05-design.png',
    bg: '#F8F7F2',
    accent1: '#DC2626',
    accent2: '#1D4ED8',
    ink: '#111827',
    headline: ['MAXI', 'MAL', 'ISM'],
    subline: 'IN GRAPHIC DESIGN',
    motif: 'editorial',
  },
  {
    name: 'poster-06-night.png',
    bg: '#FACC15',
    accent1: '#E11D48',
    accent2: '#0EA5E9',
    ink: '#18181B',
    headline: ['URBAN', 'PULSE', '8PM'],
    subline: 'SPECIAL EDITION PRINT',
    motif: 'zigzag',
  },
];

function renderProceduralPosterBlob(spec: PosterSpec): Promise<Blob> {
  const W = 900;
  const H = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = spec.bg;
  ctx.fillRect(0, 0, W, H);

  if (spec.motif === 'sunburst') {
    ctx.fillStyle = spec.accent1;
    ctx.beginPath();
    ctx.arc(W * 0.68, H * 0.34, 240, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = spec.accent2;
    ctx.fillRect(W * 0.08, H * 0.16, 260, 72);
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(W * 0.45, H);
    ctx.lineTo(W, H * 0.52);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  } else if (spec.motif === 'rings') {
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 34;
    for (let r = 130; r <= 420; r += 75) {
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.48, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = spec.accent1;
    ctx.fillRect(W * 0.56, H * 0.52, 220, 110);
  } else if (spec.motif === 'checker') {
    const cell = 64;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#111827' : '#FFFFFF';
        ctx.fillRect(W - 4 * cell + c * cell, r * cell, cell, cell);
      }
    }
    ctx.fillStyle = spec.accent2;
    ctx.beginPath();
    ctx.arc(W * 0.48, H * 0.48, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = spec.accent1;
    ctx.fillRect(0, H * 0.72, W, 190);
  } else if (spec.motif === 'stripes') {
    ctx.fillStyle = spec.accent1;
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(W * 0.08 + i * 145, 0, 56, H);
    }
    ctx.fillStyle = spec.accent2;
    ctx.beginPath();
    ctx.arc(W * 0.65, H * 0.55, 210, 0, Math.PI * 2);
    ctx.fill();
  } else if (spec.motif === 'editorial') {
    ctx.fillStyle = spec.accent2;
    ctx.fillRect(W * 0.14, H * 0.24, W * 0.72, H * 0.42);
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.45, 170, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = spec.accent1;
    ctx.fillRect(W * 0.08, H * 0.08, W * 0.84, 24);
  } else {
    ctx.fillStyle = spec.accent1;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.22);
    ctx.lineTo(W, H * 0.08);
    ctx.lineTo(W, H * 0.54);
    ctx.lineTo(0, H * 0.68);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = spec.accent2;
    ctx.beginPath();
    ctx.arc(W * 0.66, H * 0.62, 190, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bold editorial poster typography
  ctx.fillStyle = spec.ink;
  ctx.textBaseline = 'top';
  ctx.font = '800 124px "Plus Jakarta Sans", Arial, sans-serif';
  let y = H * 0.1;
  for (const line of spec.headline) {
    ctx.fillText(line, W * 0.08, y);
    y += 126;
  }

  // Bottom editorial caption bar
  ctx.fillStyle = spec.ink;
  ctx.fillRect(W * 0.08, H * 0.86, W * 0.84, 4);
  ctx.font = '700 32px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText(spec.subline, W * 0.08, H * 0.885);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate sample poster.'));
    }, 'image/png');
  });
}

export async function generateSamplePosters(): Promise<UploadedImage[]> {
  const results: UploadedImage[] = [];
  for (const spec of SAMPLE_SPECS) {
    const blob = await renderProceduralPosterBlob(spec);
    const url = URL.createObjectURL(blob);
    const item = await loadImageFromUrl(url, spec.name, 'sample');
    results.push(item);
  }
  return results;
}
