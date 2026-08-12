/**
 * Per-tab auth isolation.
 *
 * - sessionStorage holds only this tab's session id (`kittyp_sid`)
 * - localStorage holds a vault of sessions keyed by that id
 *
 * Fresh tabs have no sid → logged out.
 * Login always starts a new sid so Duplicate-tab (which copies sid) can
 * switch accounts without overwriting the other tab's vault entry.
 */

const SID_KEY = 'kittyp_sid';
const VAULT_KEY = 'kittyp_auth_vault';

const AUTH_KEYS = [
  'access_token',
  'refresh_token',
  'roles',
  'role',
  'user',
  'activeClinicId',
] as const;

export type AuthStorageKey = (typeof AUTH_KEYS)[number];

type AuthPayload = Partial<Record<AuthStorageKey, string>>;
type AuthVault = Record<string, AuthPayload>;

function readVault(): AuthVault {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as AuthVault;
  } catch {
    return {};
  }
}

function writeVault(vault: AuthVault): void {
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}

function getSid(): string | null {
  return sessionStorage.getItem(SID_KEY);
}

function createSid(): string {
  const sid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `sid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(SID_KEY, sid);
  return sid;
}

function scrubLegacyFlatKeys(): void {
  for (const key of AUTH_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
  localStorage.removeItem('persist:root');
}

/**
 * Detach this tab from any inherited session (e.g. Duplicate tab) and
 * start a blank session id. Call immediately before storing a new login.
 */
export function beginNewAuthSession(): void {
  scrubLegacyFlatKeys();
  sessionStorage.removeItem(SID_KEY);
  const sid = createSid();
  const vault = readVault();
  vault[sid] = {};
  writeVault(vault);
}

export function getAuthItem(key: AuthStorageKey): string | null {
  const sid = getSid();
  if (!sid) return null;
  const entry = readVault()[sid];
  return entry?.[key] ?? null;
}

export function setAuthItem(key: AuthStorageKey, value: string): void {
  let sid = getSid();
  if (!sid) {
    sid = createSid();
  }
  const vault = readVault();
  vault[sid] = { ...vault[sid], [key]: value };
  writeVault(vault);
}

export function removeAuthItem(key: AuthStorageKey): void {
  const sid = getSid();
  if (!sid) return;
  const vault = readVault();
  if (!vault[sid]) return;
  delete vault[sid][key];
  writeVault(vault);
}

/** Logout — remove only this tab's vault entry. Other tabs keep theirs. */
export function clearAuthStorage(): void {
  const sid = getSid();
  if (sid) {
    const vault = readVault();
    delete vault[sid];
    writeVault(vault);
  }
  sessionStorage.removeItem(SID_KEY);
  scrubLegacyFlatKeys();
}

/**
 * Upgrade path + hard scrub of legacy shared keys.
 * Never copies localStorage flat tokens into a fresh tab (that caused
 * every new tab to silently inherit the last login).
 */
export function migrateAuthFromLocalStorage(): void {
  if (typeof window === 'undefined') return;

  const existingSid = getSid();
  const flatToken = sessionStorage.getItem('access_token');

  // Previous impl stored auth flat in sessionStorage — fold into vault for this tab only.
  if (flatToken && !existingSid) {
    const sid = createSid();
    const entry: AuthPayload = {};
    for (const key of AUTH_KEYS) {
      const value = sessionStorage.getItem(key);
      if (value != null) {
        entry[key] = value;
      }
    }
    const vault = readVault();
    vault[sid] = entry;
    writeVault(vault);
  }

  scrubLegacyFlatKeys();
}

migrateAuthFromLocalStorage();
