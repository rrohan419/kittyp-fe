/**
 * Phase 1 feature flags.
 * Ecommerce / marketplace is disabled until Phase 2.
 */
export function isEcommerceEnabled(): boolean {
  const raw = import.meta.env.VITE_FEATURE_ECOMMERCE;
  if (raw === undefined || raw === '') {
    return false;
  }
  return raw === 'true' || raw === '1';
}

/** Paths that belong to the product storefront (used for nav filtering). */
export const ECOMMERCE_NAV_PATHS = new Set([
  '/products',
  '/cart',
  '/checkout',
  '/orders',
  '/app/cart',
  '/app/checkout',
  '/app/orders',
  '/admin/orders',
  '/admin/products',
]);
