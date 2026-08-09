/**
 * Product image helpers:
 * - Prefer API/DB photo URLs (verified Unsplash mappings)
 * - Rewrite Unsplash URLs to smaller/faster variants for list cards
 * - Local SVG used only as last-resort fallback
 */

const BASE = '/product-images';

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

/** Shrink Unsplash downloads for faster cards (webp + smaller width). */
export function optimizeProductImageUrl(
  url: string,
  opts: { width?: number; quality?: number } = {}
): string {
  const width = opts.width ?? 480;
  const quality = opts.quality ?? 60;

  if (!url || url.startsWith('/product-images/')) {
    return url || FALLBACK;
  }

  try {
    if (url.includes('images.unsplash.com')) {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', String(quality));
      // Prefer modern format when supported by Unsplash CDN
      u.searchParams.set('fm', 'webp');
      return u.toString();
    }
  } catch {
    return url;
  }

  return url;
}

/** Resolve display URL for a product (API photo first, SVG fallback). */
export function resolveProductImage(
  product: ProductLike,
  opts: { width?: number; quality?: number } = {}
): string {
  const stored = firstStoredUrl(product);
  if (stored && !stored.startsWith('/product-images/')) {
    return optimizeProductImageUrl(stored, opts);
  }
  // Ignore previous local-SVG placeholders if Unsplash was wiped; still allow explicit SVG
  if (stored?.startsWith('/product-images/')) {
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
