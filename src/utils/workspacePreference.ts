import type { AppRole } from '@/utils/roles';
import { ROLES, hasRole, hasAnyRole } from '@/utils/roles';

const DEFAULT_WORKSPACE_KEY = 'defaultWorkspace';

/** Per-tab preference so workspace choice does not leak across accounts. */
export function getDefaultWorkspace(): AppRole | null {
  const value = sessionStorage.getItem(DEFAULT_WORKSPACE_KEY);
  return value ? (value as AppRole) : null;
}

export function setDefaultWorkspace(role: AppRole): void {
  sessionStorage.setItem(DEFAULT_WORKSPACE_KEY, role);
}

export function clearDefaultWorkspace(): void {
  sessionStorage.removeItem(DEFAULT_WORKSPACE_KEY);
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
