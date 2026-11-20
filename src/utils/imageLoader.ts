import { UploadedImage } from '../types/collage';

export function loadImageFromUrl(url: string, name: string, idPrefix = 'img'): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new Error(`"${name}" has invalid dimensions.`));
        return;
      }
      resolve({
        id: `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
        element: img,
        focalAlign: 'center',
        panX: 0,
        panY: 0,
        zoom: 1,
      });
    };
    img.onerror = () => {
      reject(new Error(`Could not decode "${name}". Please use PNG, JPG, or WebP.`));
    };
    img.src = url;
  });
}

export async function loadUploadedFiles(files: FileList | File[]): Promise<{
  loaded: UploadedImage[];
  errors: string[];
}> {
  const fileArray = Array.from(files);
  const loaded: UploadedImage[] = [];
  const errors: string[] = [];

  for (const file of fileArray) {
    if (!file.type.startsWith('image/')) {
      errors.push(`Skipped "${file.name}" (not an image file).`);
      continue;
    }
    const objectUrl = URL.createObjectURL(file);
    try {
      const item = await loadImageFromUrl(objectUrl, file.name, 'upload');
      loaded.push(item);
    } catch (err) {
      URL.revokeObjectURL(objectUrl);
      errors.push(err instanceof Error ? err.message : `Failed to load "${file.name}".`);
    }
  }

  return { loaded, errors };
}
