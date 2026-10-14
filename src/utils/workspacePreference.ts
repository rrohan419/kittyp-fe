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

/** Resolve which workspace to open after login / cold start. */
export function resolvePreferredRole(roles: AppRole[]): AppRole | null {
  const preferred = getDefaultWorkspace();
  if (preferred && roles.includes(preferred)) {
    return preferred;
  }

  if (hasRole(roles, ROLES.DOCTOR)) {
    return ROLES.DOCTOR;
  }

  if (hasAnyRole(roles, [ROLES.CLINIC_ADMIN, ROLES.CLINIC_STAFF])) {
    return hasRole(roles, ROLES.CLINIC_ADMIN) ? ROLES.CLINIC_ADMIN : ROLES.CLINIC_STAFF;
  }

  return null;
}
