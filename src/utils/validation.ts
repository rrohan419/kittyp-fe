import DOMPurify from 'dompurify';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Exactly 10 digits (local number without country code). */
export const PHONE_REGEX = /^\d{10}$/;

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must be 8-72 characters with uppercase, lowercase, a number, and a special character';
  }
  return null;
}

export function validateEmail(email: string, required = true): string | null {
  if (!email?.trim()) return required ? 'Email is required' : null;
  if (!EMAIL_REGEX.test(email.trim())) return 'Enter a valid email address';
  return null;
}

/** 6-character public id (users, doctors, clinics). */
export const PUBLIC_ID_REGEX = /^[A-Za-z0-9]{6}$/;
/** Legacy UUID still present on some accounts before backfill. */
const LEGACY_UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function validateLoginIdentifier(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Email or ID is required';
  if (v.includes('@')) return validateEmail(v);
  if (PUBLIC_ID_REGEX.test(v) || LEGACY_UUID_REGEX.test(v)) return null;
  return 'Enter your email or account, doctor, or clinic ID';
}

/** Emails lowercased; 6-char IDs uppercased; legacy UUIDs unchanged. */
export function normalizeLoginIdentifier(value: string): string {
  const v = value.trim();
  if (v.includes('@')) return v.toLowerCase();
  if (PUBLIC_ID_REGEX.test(v)) return v.toUpperCase();
  return v;
}

/**
 * Normalize to India 10-digit local number.
 * Handles paste of +91…, 91…, 0…, and spaces/dashes.
 */
export function normalizeLocalPhone(raw: string): string {
  let digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length >= 12 && digits.startsWith('91')) {
    digits = digits.slice(-10);
  } else if (digits.length === 11 && digits.startsWith('91')) {
    // Ambiguous short form — keep last 10 if remaining looks like a mobile
    digits = digits.slice(-10);
  } else if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits.slice(0, 10);
}

export function validatePhone(phone: string, required = false): string | null {
  const cleaned = normalizeLocalPhone(phone);
  if (!cleaned) return required ? 'Phone number is required' : null;
  if (!PHONE_REGEX.test(cleaned)) return 'Phone number must be exactly 10 digits';
  return null;
}

/** Digits-only local phone for inputs; normalizes country-code pastes to 10 digits. */
export function digitsOnlyPhone(value: string, _maxLen = 10): string {
  return normalizeLocalPhone(value);
}

/** E.164-style full phone for OTP/API (India default). */
export function toE164Phone(localPhone: string, countryCode = '+91'): string {
  const local = normalizeLocalPhone(localPhone);
  const code = (countryCode || '+91').trim() || '+91';
  return `${code}${local}`;
}

const HTML_ALLOWLIST = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
    'img', 'span', 'div', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'width', 'height'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'style'],
  FORBID_ATTR: ['style'],
} as const;

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, HTML_ALLOWLIST);
}

/** Parse Spring / API error bodies into a readable message. */
export function parseApiErrorMessage(raw: string, fallback = 'Something went wrong'): string {
  if (!raw?.trim()) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.message === 'string' && parsed.message.trim()) return parsed.message;
    if (Array.isArray(parsed?.errors) && parsed.errors[0]?.defaultMessage) {
      return parsed.errors.map((e: { defaultMessage?: string }) => e.defaultMessage).filter(Boolean).join('. ');
    }
    if (typeof parsed?.error === 'string') return parsed.error;
  } catch {
    // not JSON
  }
  return raw.length > 200 ? fallback : raw;
}
