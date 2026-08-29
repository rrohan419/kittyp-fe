import type { AppRole } from '@/utils/roles';
import { ROLES, hasRole, hasAnyRole } from '@/utils/roles';

const DEFAULT_WORKSPACE_KEY = 'defaultWorkspace';

function readPref(): string | null {
  try {
    return localStorage.getItem(DEFAULT_WORKSPACE_KEY) || sessionStorage.getItem(DEFAULT_WORKSPACE_KEY);
  } catch {
    return null;
  }
}

function writePref(value: string): void {
  try {
    localStorage.setItem(DEFAULT_WORKSPACE_KEY, value);
    sessionStorage.removeItem(DEFAULT_WORKSPACE_KEY);
  } catch {
    /* ignore */
  }
}

function removePref(): void {
  try {
    localStorage.removeItem(DEFAULT_WORKSPACE_KEY);
    sessionStorage.removeItem(DEFAULT_WORKSPACE_KEY);
  } catch {
    /* ignore */
  }
}

/** Browser-wide preference — one signed-in account per browser. */
export function getDefaultWorkspace(): AppRole | null {
  const value = readPref();
  return value ? (value as AppRole) : null;
}

export function setDefaultWorkspace(role: AppRole): void {
  writePref(role);
}

export function clearDefaultWorkspace(): void {
  removePref();
}

/**
 * Resolve which workspace to open after login / cold start.
 * Doctors always open the doctor portal first — clinic admin is a secondary
 * workspace via "Switch workspace". Saved clinic defaults are ignored for
 * dual-role doctor accounts so login does not land on /clinic.
 */
export function resolvePreferredRole(roles: AppRole[]): AppRole | null {
  if (hasRole(roles, ROLES.DOCTOR)) {
    const preferred = getDefaultWorkspace();
    // Drop stale clinic defaults that trapped doctors on the clinic portal.
    if (preferred === ROLES.CLINIC_ADMIN || preferred === ROLES.CLINIC_STAFF) {
      clearDefaultWorkspace();
    }
    return ROLES.DOCTOR;
  }

  const preferred = getDefaultWorkspace();
  if (preferred && roles.includes(preferred)) {
    return preferred;
  }

  if (hasAnyRole(roles, [ROLES.CLINIC_ADMIN, ROLES.CLINIC_STAFF])) {
    return hasRole(roles, ROLES.CLINIC_ADMIN) ? ROLES.CLINIC_ADMIN : ROLES.CLINIC_STAFF;
  }

  return null;
}
