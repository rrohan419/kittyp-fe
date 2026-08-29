/**
 * Single-browser auth storage (localStorage).
 * All tabs share one signed-in account — no per-tab sessions.
 */

const AUTH_KEYS = [
  'access_token',
  'refresh_token',
  'roles',
  'role',
  'user',
  'activeClinicId',
] as const;

export type AuthStorageKey = (typeof AUTH_KEYS)[number];

const SID_KEY = 'kittyp_sid';
const VAULT_KEY = 'kittyp_auth_vault';

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  localStorage.setItem(key, value);
}

function removeLocal(key: string): void {
  localStorage.removeItem(key);
}

/** Fold the old per-tab vault into flat localStorage once. */
function migrateFromTabVault(): void {
  if (typeof window === 'undefined') return;

  try {
    const vaultRaw = localStorage.getItem(VAULT_KEY);
    if (vaultRaw) {
      const vault = JSON.parse(vaultRaw) as Record<string, Partial<Record<AuthStorageKey, string>>>;
      const sid = sessionStorage.getItem(SID_KEY);
      const entries = vault && typeof vault === 'object' ? Object.entries(vault) : [];
      const preferred =
        (sid && vault?.[sid]) ||
        entries.find(([, payload]) => payload?.access_token)?.[1] ||
        entries[0]?.[1];
      if (preferred) {
        for (const key of AUTH_KEYS) {
          const value = preferred[key];
          if (value && !readLocal(key)) {
            writeLocal(key, value);
          }
        }
      }
      localStorage.removeItem(VAULT_KEY);
    }
  } catch {
    localStorage.removeItem(VAULT_KEY);
  }

  try {
    sessionStorage.removeItem(SID_KEY);
    for (const key of AUTH_KEYS) {
      const fromSession = sessionStorage.getItem(key);
      if (fromSession && !readLocal(key)) {
        writeLocal(key, fromSession);
      }
      sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

migrateFromTabVault();

export function getAuthItem(key: AuthStorageKey): string | null {
  return readLocal(key);
}

export function setAuthItem(key: AuthStorageKey, value: string): void {
  writeLocal(key, value);
}

export function removeAuthItem(key: AuthStorageKey): void {
  removeLocal(key);
}

export function clearAuthStorage(): void {
  for (const key of AUTH_KEYS) {
    removeLocal(key);
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  removeLocal(VAULT_KEY);
  try {
    sessionStorage.removeItem(SID_KEY);
  } catch {
    /* ignore */
  }
}
