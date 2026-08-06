export const ROLES = {
  USER: 'ROLE_USER',
  MODERATOR: 'ROLE_MODERATOR',
  ADMIN: 'ROLE_ADMIN',
  DOCTOR: 'ROLE_DOCTOR',
  CLINIC_ADMIN: 'ROLE_CLINIC_ADMIN',
  CLINIC_STAFF: 'ROLE_CLINIC_STAFF',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export const hasRole = (roles: string[] | undefined, role: AppRole): boolean =>
  Array.isArray(roles) && roles.includes(role);

export const hasAnyRole = (roles: string[] | undefined, allowed: AppRole[]): boolean =>
  Array.isArray(roles) && allowed.some((r) => roles.includes(r));

export const PORTAL_HOME: Record<string, string> = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.DOCTOR]: '/doctor',
  [ROLES.CLINIC_ADMIN]: '/clinic',
  [ROLES.CLINIC_STAFF]: '/clinic',
  [ROLES.MODERATOR]: '/admin',
  [ROLES.USER]: '/app',
};

export const getPortalHome = (roles?: string[]): string => {
  if (!roles?.length) return '/login';
  if (hasRole(roles, ROLES.ADMIN)) return PORTAL_HOME[ROLES.ADMIN];
  if (hasRole(roles, ROLES.MODERATOR)) return PORTAL_HOME[ROLES.MODERATOR];
  if (hasRole(roles, ROLES.DOCTOR)) return PORTAL_HOME[ROLES.DOCTOR];
  if (hasAnyRole(roles, [ROLES.CLINIC_ADMIN, ROLES.CLINIC_STAFF])) {
    return PORTAL_HOME[ROLES.CLINIC_ADMIN];
  }
  return PORTAL_HOME[ROLES.USER];
};

export const getPortalPath = (role: AppRole): string => {
  return PORTAL_HOME[role] ?? '/login';
};

export const getRoleLabel = (role: AppRole): string => {
  switch (role) {
    case ROLES.USER:
      return 'Pet Parent';
    case ROLES.DOCTOR:
      return 'Doctor';
    case ROLES.CLINIC_ADMIN:
      return 'Clinic Admin';
    case ROLES.CLINIC_STAFF:
      return 'Clinic Staff';
    case ROLES.ADMIN:
      return 'Admin';
    case ROLES.MODERATOR:
      return 'Moderator';
    default:
      return role;
  }
};

/** Post-login workspace picker CTA, e.g. "Continue as Doctor". */
export const getContinueAsLabel = (role: AppRole): string =>
  `Continue as ${getRoleLabel(role)}`;


/** Doctors can edit nutrition plan previews before saving. */
export const canEditNutritionPlan = (roles?: string[]): boolean =>
  hasRole(roles, ROLES.DOCTOR);
