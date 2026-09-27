import DOMPurify, { type Config } from 'dompurify';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
/** Letters, spaces, hyphen, apostrophe, period. */
export const NAME_REGEX = /^[\p{L}][\p{L} .'-]{0,49}$/u;
/** Clinic / practice names may include digits and a few punctuation marks. */
export const CLINIC_NAME_REGEX = /^[\p{L}\p{N}][\p{L}\p{N} .,'&()-]{0,99}$/u;
/** Exactly 10 digits (local number without country code). */
export const PHONE_REGEX = /^\d{10}$/;

export const EMAIL_ALREADY_REGISTERED =
  'This email is already registered. Sign in or use a different email.';
export const OTP_FAILED_MESSAGE =
  'That code is invalid or expired. Request a new OTP and try again.';

export function isEmailAlreadyRegistered(message: string): boolean {
  const m = (message || '').toLowerCase();
  return m.includes('already registered') || (m.includes('already exists') && m.includes('email'));
}

export function isOtpFailed(message: string): boolean {
  const m = (message || '').toLowerCase();
  return m.includes('otp') || m.includes('invalid or expired');
}

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

export function validatePersonName(value: string, label: string, required = true): string | null {
  const v = value?.trim() ?? '';
  if (!v) return required ? `${label} is required` : null;
  if (v.length < 2) return `${label} must be at least 2 characters`;
  if (!NAME_REGEX.test(v)) {
    return `${label} can only contain letters, spaces, hyphens, and apostrophes`;
  }
  return null;
}

/** Strip digits/symbols while typing a person name (letters, spaces, . ' - only). */
export function sanitizePersonNameInput(raw: string, maxLen = 50): string {
  return (raw || '').replace(/[^\p{L} .'-]/gu, '').slice(0, maxLen);
}

/** Optional pet weight in kg. Empty is OK; otherwise a finite number in [0.1, 500], max 2 decimals. */
export function validatePetWeightKg(value: string): string | null {
  const v = value?.trim() ?? '';
  if (!v) return null;
  if (v.endsWith('.')) return 'Weight must be a valid number (kg)';
  if (/\.\d{3,}/.test(v)) return 'Weight can have at most 2 decimal places';
  const n = Number(v);
  if (!Number.isFinite(n)) return 'Weight must be a valid number (kg)';
  if (n < 0.1 || n > 500) return 'Weight must be between 0.1 and 500 kg';
  return null;
}

/** Optional body temp °C. Empty OK; else finite in [30, 45], max 2 decimals. */
export function validatePetTempC(value: string): string | null {
  const v = value?.trim() ?? '';
  if (!v) return null;
  if (v.endsWith('.')) return 'Temperature must be a valid number (°C)';
  if (/\.\d{3,}/.test(v)) return 'Temperature can have at most 2 decimal places';
  const n = Number(v);
  if (!Number.isFinite(n)) return 'Temperature must be a valid number (°C)';
  if (n < 30 || n > 45) return 'Temperature must be between 30 and 45 °C';
  return null;
}

/**
 * Digits + optional single decimal point; caps fractional digits.
 * Strips letters; no spinner field needed (use type="text").
 */
export function sanitizeDecimalInput(raw: string, maxDecimals = 2): string {
  const cleaned = (raw || '').replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned;
  const intPart = cleaned.slice(0, dot);
  const frac = cleaned.slice(dot + 1).replace(/\./g, '').slice(0, Math.max(0, maxDecimals));
  return `${intPart}.${frac}`;
}

/** Digits + optional single decimal (max 2 places) for pet weight. */
export function sanitizePetWeightInput(raw: string): string {
  return sanitizeDecimalInput(raw, 2);
}

export function validateClinicName(value: string): string | null {
  const v = value?.trim() ?? '';
  if (!v) return 'Clinic name is required';
  if (v.length < 2) return 'Clinic name must be at least 2 characters';
  if (!CLINIC_NAME_REGEX.test(v)) return 'Clinic name contains invalid characters';
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

/** Digits-only local phone for inputs; hard-caps at 10 digits. */
export function digitsOnlyPhone(value: string, maxLen = 10): string {
  return normalizeLocalPhone(value).slice(0, maxLen);
}

/** E.164-style full phone for OTP/API (India default). */
export function toE164Phone(localPhone: string, countryCode = '+91'): string {
  const local = normalizeLocalPhone(localPhone);
  const code = (countryCode || '+91').trim() || '+91';
  return `${code}${local}`;
}

const HTML_ALLOWLIST: Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
    'img', 'span', 'div', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'width', 'height'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'style'],
  FORBID_ATTR: ['style'],
};

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, HTML_ALLOWLIST);
}

/** Parse Spring / API error bodies, Axios errors, or raw strings into a readable message. */
export function parseApiErrorMessage(raw: unknown, fallback = 'Something went wrong'): string {
  if (raw == null) return fallback;
  if (typeof raw === 'object') {
    const ax = raw as { response?: { data?: unknown }; message?: string };
    if (ax.response?.data !== undefined) {
      return parseApiErrorMessage(ax.response.data, fallback);
    }
    if (typeof ax.message === 'string' && ax.message.trim()) {
      return ax.message;
    }
  }
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
  if (!text?.trim() || text === '{}' || text === 'null') return fallback;
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.message === 'string' && parsed.message.trim()) return parsed.message;
    if (Array.isArray(parsed?.errors) && parsed.errors[0]?.defaultMessage) {
      return parsed.errors.map((e: { defaultMessage?: string }) => e.defaultMessage).filter(Boolean).join('. ');
    }
    if (typeof parsed?.error === 'string') return parsed.error;
  } catch {
    // not JSON
  }
  return text.length > 200 ? fallback : text;
}
