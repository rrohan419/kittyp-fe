import { hasRole, ROLES, type AppRole, type SignupRole } from './roles.ts';

/** Matches the backend public-signup 409. Does not name a role. */
export const ACCOUNT_EXISTS_MESSAGE =
  'An account with this email already exists. Sign in to continue.';

export const isAccountExistsMessage = (message: string | undefined | null): boolean =>
  message === ACCOUNT_EXISTS_MESSAGE;

/** Same email may hold one pet parent, one doctor, and one clinic. A second copy of the same role is blocked. */
export function classifyExistingRoles(
  roles: string[] | undefined,
  signupRole: SignupRole,
): 'available' | 'duplicate' {
  return hasRole(roles, SIGNUP_ROLE_TO_APP[signupRole]) ? 'duplicate' : 'available';
}

export function duplicateRoleMessage(signupRole: SignupRole): string {
  if (signupRole === 'DOCTOR') return 'This email already has a doctor account.';
  if (signupRole === 'CLINIC') return 'This email already has a clinic account.';
  return 'This email already has a pet parent account.';
}

/**
 * Prove the existing account with the password typed on the signup form.
 * available = email exists and this role is not on it yet.
 * duplicate = this role is already on the email.
 * rejected = password did not match.
 */
export async function signInToAddRole(
  email: string,
  password: string,
  signupRole: SignupRole,
): Promise<'available' | 'duplicate' | 'rejected'> {
  try {
    const { login } = await import('@/services/authService');
    const { roles } = await login({ email: email.trim(), password });
    return classifyExistingRoles(roles, signupRole);
  } catch {
    return 'rejected';
  }
}

/** API error text from axios or a thrown Error. */
export function apiMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (message) return message;
  }
  return error instanceof Error ? error.message : fallback;
}

/**
 * Where to go after login when signup asked the user to sign in first.
 * Null means a normal login: open the existing portal and do not create a role.
 */
export function postLoginPath(addRole: SignupRole | null): string | null {
  if (addRole === 'USER' || addRole === 'DOCTOR' || addRole === 'CLINIC') {
    return `/signup?role=${addRole}`;
  }
  return null;
}

export const SIGNUP_ROLE_TO_APP: Record<SignupRole, AppRole> = {
  USER: ROLES.USER,
  DOCTOR: ROLES.DOCTOR,
  CLINIC: ROLES.CLINIC_ADMIN,
};

/**
 * Navigation is allowed only when the refreshed profile, the persisted user
 * blob, and the separate roles key all contain the new role.
 */
export const sessionHasActivatedRole = (
  reduxRoles: string[] | undefined,
  persistedUserRoles: string[] | undefined,
  storedRoles: string[] | null | undefined,
  signupRole: SignupRole,
): boolean => {
  const appRole = SIGNUP_ROLE_TO_APP[signupRole];
  return (
    hasRole(reduxRoles, appRole) &&
    hasRole(persistedUserRoles, appRole) &&
    Array.isArray(storedRoles) &&
    storedRoles.includes(appRole)
  );
};
