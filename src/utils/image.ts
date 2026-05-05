type UnsplashOptions = {
  width?: number;
  quality?: number;
  fit?: 'crop' | 'max' | 'clip' | 'fill' | 'scale';
};

function isUnsplash(url: URL): boolean {
  return url.hostname === 'images.unsplash.com';
}

export function buildOptimizedImageUrl(rawUrl: string | undefined, options: UnsplashOptions = {}): string {
  const value = String(rawUrl || '').trim();
  if (!value) return '';

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch (_) {
    return value;
  }

  if (!isUnsplash(parsed)) {
    return value;
  }

  const width = options.width ?? 1280;
  const quality = options.quality ?? 78;
  const fit = options.fit ?? 'max';

  parsed.searchParams.set('auto', 'format');
  parsed.searchParams.set('q', String(quality));
  parsed.searchParams.set('fit', fit);
  parsed.searchParams.set('w', String(width));
  return parsed.toString();
}

export function buildOptimizedSrcSet(rawUrl: string | undefined, widths: number[], quality = 78): string {
  const source = String(rawUrl || '').trim();
  if (!source) return '';

  let parsed: URL;
  try {
    parsed = new URL(source);
  } catch (_) {
    return '';
  }
  if (!isUnsplash(parsed)) return '';

  return widths
    .filter((width) => Number.isFinite(width) && width > 0)
    .map((width) => `${buildOptimizedImageUrl(source, { width, quality })} ${width}w`)
    .join(', ');
}
