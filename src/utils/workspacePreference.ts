import type { AppRole } from '@/utils/roles';

const DEFAULT_WORKSPACE_KEY = 'defaultWorkspace';

export function getDefaultWorkspace(): AppRole | null {
  const value = localStorage.getItem(DEFAULT_WORKSPACE_KEY);
  return value ? (value as AppRole) : null;
}

export function setDefaultWorkspace(role: AppRole): void {
  localStorage.setItem(DEFAULT_WORKSPACE_KEY, role);
}

export function clearDefaultWorkspace(): void {
  localStorage.removeItem(DEFAULT_WORKSPACE_KEY);
}

/** Returns a saved default only when it is still one of the user's roles. */
export function resolvePreferredRole(roles: AppRole[]): AppRole | null {
  const preferred = getDefaultWorkspace();
  if (!preferred || !roles.includes(preferred)) {
    return null;
  }
  return preferred;
}
