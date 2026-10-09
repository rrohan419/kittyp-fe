import { ROLES } from './roles.ts';

export type WorkspaceKey = 'app' | 'doctor' | 'clinic' | 'admin';

const paths = new Map<WorkspaceKey, string>();

/** Portal prefix for a URL. Null for public pages and the role chooser. */
export function workspaceKey(pathname: string): WorkspaceKey | null {
  if (pathname === '/app' || pathname.startsWith('/app/')) return 'app';
  if (pathname === '/doctor' || pathname.startsWith('/doctor/')) return 'doctor';
  if (pathname === '/clinic' || pathname.startsWith('/clinic/')) return 'clinic';
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  return null;
}

export function rememberWorkspacePath(pathname: string, search = '', hash = ''): void {
  const key = workspaceKey(pathname);
  if (!key) return;
  paths.set(key, `${pathname}${search}${hash}`);
}

export function rememberedWorkspacePath(key: WorkspaceKey): string | null {
  return paths.get(key) ?? null;
}

export function workspaceKeyForRole(role: string): WorkspaceKey | null {
  if (role === ROLES.USER) return 'app';
  if (role === ROLES.DOCTOR) return 'doctor';
  if (role === ROLES.CLINIC_ADMIN || role === ROLES.CLINIC_STAFF) return 'clinic';
  if (role === ROLES.ADMIN || role === ROLES.MODERATOR) return 'admin';
  return null;
}

/** Where Switch role should return for a role that was already open. */
export function pathForWorkspaceRole(role: string): string | null {
  const key = workspaceKeyForRole(role);
  return key ? rememberedWorkspacePath(key) : null;
}

export function clearWorkspaceMemory(): void {
  paths.clear();
}
