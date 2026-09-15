/** HTTPS localhost talking to HTTP :8002 is mixed content. Keep local API same-origin. */
function toSameOriginLocalApi(url: string | undefined): string {
  if (!url) return '';
  return url
    .replace(/^https?:\/\/localhost:8002/, '')
    .replace(/^https?:\/\/127\.0\.0\.1:8002/, '');
}

export const API_BASE_URL = toSameOriginLocalApi(import.meta.env.VITE_API_BASE_URL);
export const GOOGLE_SSO_URL = toSameOriginLocalApi(import.meta.env.VITE_GOOGLE_SSO_URL);
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
/** KittyP Facebook Login for Business app (public). Env override optional. */
export const META_APP_ID = import.meta.env.VITE_META_APP_ID || '1618807626635540';
export const META_CONFIG_ID =
  import.meta.env.VITE_META_CONFIG_ID ||
  import.meta.env.VITE_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID ||
  '1651857043031783';
