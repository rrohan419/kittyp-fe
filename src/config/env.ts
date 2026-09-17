/** HTTPS localhost talking to HTTP :8082 is mixed content. Keep local API same-origin. */
function toSameOriginLocalApi(url: string | undefined): string {
  if (!url) return '';
  return url
    .replace(/^https?:\/\/localhost:8082/, '')
    .replace(/^https?:\/\/127\.0\.0\.1:8082/, '');
}

export const API_BASE_URL = toSameOriginLocalApi(import.meta.env.VITE_API_BASE_URL);
export const GOOGLE_SSO_URL = toSameOriginLocalApi(import.meta.env.VITE_GOOGLE_SSO_URL);

/** Facebook Login for Business app id — public, but must come from env (no source fallback). */
export const META_APP_ID = (import.meta.env.VITE_META_APP_ID as string | undefined)?.trim() || '';
/** Embedded signup config id — public; require env so deploys are explicit. */
export const META_CONFIG_ID = (
  (import.meta.env.VITE_META_CONFIG_ID as string | undefined) ||
  (import.meta.env.VITE_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID as string | undefined) ||
  ''
).trim();
