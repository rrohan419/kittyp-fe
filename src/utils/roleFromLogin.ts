import type { AppRole } from './roles.ts';

const LOGIN_ROLE_KEY = 'kittypLoginRole';

/** Remember which role password matched this login. Cleared when the next login has no unique role. */
export function rememberLoginRole(role: string | null | undefined): void {
  try {
    if (role) sessionStorage.setItem(LOGIN_ROLE_KEY, role);
    else sessionStorage.removeItem(LOGIN_ROLE_KEY);
  } catch {
    /* ignore */
  }
}

export function peekLoginRole(): string | null {
  try {
    return sessionStorage.getItem(LOGIN_ROLE_KEY);
  } catch {
    return null;
  }
}

/** Role password match opens that workspace. Anything else returns null so the preferred portal is used. */
export function roleFromLogin(roles: AppRole[], loginRole: string | null | undefined): AppRole | null {
  if (!loginRole || !roles.includes(loginRole as AppRole)) {
    return null;
  }
  return loginRole as AppRole;
}
