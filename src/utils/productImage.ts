/**
 * Product image helpers:
 * - Prefer API/DB photo URLs (local /product-photos first)
 * - Pass local photos through unchanged for fast loads
 * - Rewrite Unsplash URLs to smaller/faster variants for list cards
 * - Local SVG used only as absolute last-resort fallback
 */

const BASE = '/product-images';
const LOCAL_PHOTOS = '/product-photos';

export const PRODUCT_IMAGE = {
  accessories: `${BASE}/accessories.svg`,
} as const;

const FALLBACK = PRODUCT_IMAGE.accessories;

type ProductLike = {
  sku?: string | null;
  name?: string | null;
  category?: string | null;
  productImageUrls?: string[] | Record<string, string> | null;
};

function firstStoredUrl(product: ProductLike): string | null {
  const urls = product.productImageUrls as unknown;
  if (Array.isArray(urls)) {
    const first = urls.find((u) => typeof u === 'string' && u.trim().length > 0);
    return first ?? null;
  }
  if (urls && typeof urls === 'object') {
    const first = Object.values(urls as Record<string, string>).find(
      (u) => typeof u === 'string' && u.trim().length > 0
    );
    return first ?? null;
  }
  return null;
}

function isLocalPhoto(url: string): boolean {
  return url.startsWith(`${LOCAL_PHOTOS}/`);
}

function isSvgPlaceholder(url: string): boolean {
  return url.startsWith(`${BASE}/`) && url.endsWith('.svg');
}

/** Shrink Unsplash downloads for faster cards (webp + smaller width). */
export function optimizeProductImageUrl(
  url: string,
  opts: { width?: number; quality?: number } = {}
): string {
  const width = opts.width ?? 480;
  const quality = opts.quality ?? 60;

  if (!url) {
    return FALLBACK;
  }

  // Local product photos: serve as-is (already optimized WebP)
  if (isLocalPhoto(url)) {
    return url;
  }

  // Explicit local SVG paths pass through only when intentionally stored
  if (url.startsWith(`${BASE}/`)) {
    return url;
  }

  try {
    if (url.includes('images.unsplash.com')) {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', String(quality));
      u.searchParams.set('fm', 'webp');
      return u.toString();
    }
  } catch {
    return url;
  }

  return url;
}

/** Resolve display URL for a product (local photo first, SVG last resort). */
export function resolveProductImage(
  product: ProductLike,
  opts: { width?: number; quality?: number } = {}
): string {
  const stored = firstStoredUrl(product);

  if (stored && isLocalPhoto(stored)) {
    return stored;
  }

  // Prefer remote photos over SVG placeholders
  if (stored && !isSvgPlaceholder(stored)) {
    return optimizeProductImageUrl(stored, opts);
  }

  // SVG only as absolute last resort
  if (stored && isSvgPlaceholder(stored)) {
    return stored;
  }

  return FALLBACK;
}

export function resolveProductImages(
  product: ProductLike,
  opts: { width?: number; quality?: number } = {}
): string[] {
  return [resolveProductImage(product, opts)];
}
