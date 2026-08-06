/**
 * Phase 1 feature flags.
 * Ecommerce / marketplace (Phase 2 store) is disabled until explicitly enabled.
 *
 * Env (Vite): VITE_FEATURE_ECOMMERCE or VITE_ENABLE_STORE === 'true' | '1'
 * (Brief alias for ENABLE_STORE — Next.js NEXT_PUBLIC_* is not used in this Vite app.)
 */
function readStoreFlag(): string | undefined {
  const ecommerce = import.meta.env.VITE_FEATURE_ECOMMERCE;
  const enableStore = import.meta.env.VITE_ENABLE_STORE;
  if (ecommerce !== undefined && ecommerce !== '') {
    return ecommerce;
  }
  if (enableStore !== undefined && enableStore !== '') {
    return enableStore;
  }
  return undefined;
}

export function isEcommerceEnabled(): boolean {
  const raw = readStoreFlag();
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
