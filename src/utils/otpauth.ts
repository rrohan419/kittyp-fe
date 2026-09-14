export const MASTER_TOTP_DONE_KEY = 'kittyp-master-totp-setup-done';

export function setupKeyFromOtpauth(uri: string | null | undefined): string | null {
  if (!uri) return null;
  const match = /[?&]secret=([^&]+)/i.exec(uri);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function isMasterTotpSetupDone(
  setupKey: string | null | undefined,
  storage?: Pick<Storage, 'getItem'> | null
): boolean {
  if (!setupKey) return false;
  const store = storage === undefined ? defaultStorage() : storage;
  if (!store) return false;
  try {
    return store.getItem(MASTER_TOTP_DONE_KEY) === setupKey;
  } catch {
    return false;
  }
}

export function markMasterTotpSetupDone(
  setupKey: string,
  storage?: Pick<Storage, 'setItem'> | null
): void {
  const store = storage === undefined ? defaultStorage() : storage;
  store?.setItem(MASTER_TOTP_DONE_KEY, setupKey);
}

function defaultStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
