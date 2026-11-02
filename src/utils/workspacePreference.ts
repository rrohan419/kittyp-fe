import type { AppRole } from './roles.ts';
import { ROLES, hasRole, hasAnyRole, getPortalPath } from './roles.ts';

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

const LAST_WORKSPACE_KEY = 'kittyp:lastWorkspace';

export type ClinicPortal = 'doctor' | 'clinic';

export interface LastWorkspace {
  userUuid: string;
  role?: AppRole;
  /** Remembered practice per portal: doctor portal may be Personal, clinic portal is a branch. */
  clinics?: Partial<Record<ClinicPortal, string>>;
  /** Practice the user explicitly chose to open by default, per portal. */
  defaultClinics?: Partial<Record<ClinicPortal, string>>;
}

type WorkspaceStore = Record<string, LastWorkspace>;

function readStore(): WorkspaceStore {
  try {
    const parsed = JSON.parse(localStorage.getItem(LAST_WORKSPACE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object') return {};
    // Legacy single-user shape: { userUuid, ... }
    if (typeof parsed.userUuid === 'string') return { [parsed.userUuid]: parsed as LastWorkspace };
    return parsed as WorkspaceStore;
  } catch {
    return {};
  }
}

function writeEntry(entry: LastWorkspace): void {
  localStorage.setItem(
    LAST_WORKSPACE_KEY,
    JSON.stringify({ ...readStore(), [entry.userUuid]: entry })
  );
}

/** Last-used workspace and defaults, remembered per browser for each user. Survives logout. */
export function getLastWorkspace(userUuid?: string | null): LastWorkspace | null {
  if (!userUuid) return null;
  return readStore()[userUuid] ?? null;
}

export function saveLastWorkspace(
  userUuid: string | null | undefined,
  patch: { role?: AppRole; portal?: ClinicPortal; clinicId?: string | null }
): void {
  if (!userUuid) return;
  try {
    const current = getLastWorkspace(userUuid) ?? { userUuid };
    const next: LastWorkspace = { ...current, userUuid };
    if (patch.role) next.role = patch.role;
    if (patch.portal && patch.clinicId) {
      next.clinics = { ...current.clinics, [patch.portal]: patch.clinicId };
    }
    writeEntry(next);
  } catch {
    /* ignore */
  }
}

export function getDefaultClinicId(userUuid: string | null | undefined, portal: ClinicPortal): string | null {
  return getLastWorkspace(userUuid)?.defaultClinics?.[portal] ?? null;
}

/** Pass null to clear the default for that portal. */
export function setDefaultClinicId(
  userUuid: string | null | undefined,
  portal: ClinicPortal,
  clinicId: string | null
): void {
  if (!userUuid) return;
  try {
    const current = getLastWorkspace(userUuid) ?? { userUuid };
    const defaults = { ...current.defaultClinics };
    if (clinicId) defaults[portal] = clinicId;
    else delete defaults[portal];
    writeEntry({ ...current, defaultClinics: defaults });
  } catch {
    /* ignore */
  }
}

export function getLastClinicId(userUuid: string | null | undefined, portal: ClinicPortal): string | null {
  return getLastWorkspace(userUuid)?.clinics?.[portal] ?? null;
}

/** Resolve which workspace to open after login / cold start. */
export function resolvePreferredRole(roles: AppRole[], userUuid?: string | null): AppRole | null {
  const preferred = getDefaultWorkspace();
  if (preferred && roles.includes(preferred)) {
    return preferred;
  }

  const last = getLastWorkspace(userUuid)?.role;
  if (last && roles.includes(last)) {
    return last;
  }

  if (hasRole(roles, ROLES.DOCTOR)) {
    return ROLES.DOCTOR;
  }

  if (hasAnyRole(roles, [ROLES.CLINIC_ADMIN, ROLES.CLINIC_STAFF])) {
    return hasRole(roles, ROLES.CLINIC_ADMIN) ? ROLES.CLINIC_ADMIN : ROLES.CLINIC_STAFF;
  }

  return null;
}

/** A redirect is only honored when it stays inside the workspace being opened. */
export function isRedirectInPortal(redirect: string | null | undefined, role: AppRole): redirect is string {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return false;
  const prefix = '/' + (getPortalPath(role).split('/')[1] ?? '');
  if (prefix === '/') return false;
  return redirect === prefix || /^\/[^/?#]+/.exec(redirect)?.[0] === prefix;
}

/** Where to send a signed-in user: workspace to open + path inside it. */
export function resolvePostLoginTarget(
  roles: AppRole[],
  userUuid?: string | null,
  redirect?: string | null
): { role: AppRole; path: string } | null {
  if (!roles.length) return null;
  const role = resolvePreferredRole(roles, userUuid) ?? (roles.includes(ROLES.USER) ? ROLES.USER : roles[0]);
  return { role, path: isRedirectInPortal(redirect, role) ? redirect : getPortalPath(role) };
}
