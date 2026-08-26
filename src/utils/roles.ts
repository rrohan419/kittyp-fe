export const ROLES = {
  USER: 'ROLE_USER',
  MODERATOR: 'ROLE_MODERATOR',
  ADMIN: 'ROLE_ADMIN',
  DOCTOR: 'ROLE_DOCTOR',
  CLINIC_ADMIN: 'ROLE_CLINIC_ADMIN',
  CLINIC_STAFF: 'ROLE_CLINIC_STAFF',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

/** Public self-service signup only — never includes ADMIN, MODERATOR, or CLINIC_STAFF. */
export const SIGNUP_ROLES = ['USER', 'DOCTOR', 'CLINIC'] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const isSignupRole = (value: string | null | undefined): value is SignupRole =>
  value === 'USER' || value === 'DOCTOR' || value === 'CLINIC';

export const SIGNUP_ROLE_LABELS: Record<SignupRole, string> = {
  USER: 'Pet parent',
  DOCTOR: 'Doctor',
  CLINIC: 'Clinic',
};

/** Public marketing/nav links — three signups, never one generic button. */
export const PUBLIC_SIGNUP_PATHS = [
  {
    to: '/signup',
    label: 'Pet parent',
    description: 'Book clinics and doctors',
  },
  {
    to: '/signup/doctor',
    label: 'Veterinarian',
    description: 'Online practice on Kittyp',
  },
  {
    to: '/signup/clinic-admin',
    label: 'Clinic / hospital',
    description: 'Register your clinic',
  },
] as const;

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

/** Distinct portal URLs for a user's roles (clinic admin + staff count as one). */
export const portalHomesForRoles = (roles?: string[]): string[] => {
  if (!roles?.length) return [];
  const homes = new Set<string>();
  for (const role of roles) {
    const home = PORTAL_HOME[role];
    if (home) homes.add(home);
  }
  return [...homes];
};

/** True when the user has two or more distinct workspaces (not merely two role strings). */
export const canSwitchWorkspace = (roles?: string[]): boolean =>
  portalHomesForRoles(roles).length > 1;

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


/** Clinic admin/staff can send doctor invites; doctors cannot. */
export const canInviteDoctors = (roles?: string[]): boolean =>
  hasAnyRole(roles, [ROLES.CLINIC_ADMIN, ROLES.CLINIC_STAFF]);

/** Doctors can edit nutrition plan previews before saving. */
export const canEditNutritionPlan = (roles?: string[]): boolean =>
  hasRole(roles, ROLES.DOCTOR);

/**
 * Verification docs / KYC: own profile always.
 * Other doctors: only clinic admin on the clinic portal — never a peer on /doctor.
 */
export const canViewDoctorCertificates = (
  roles: string[] | undefined,
  viewerUserUuid: string | undefined,
  profileUserUuid: string | undefined,
  clinicAdminContext = false
): boolean => {
  const isSelf =
    !!viewerUserUuid && !!profileUserUuid && viewerUserUuid === profileUserUuid;
  if (isSelf) return true;
  return clinicAdminContext && hasRole(roles, ROLES.CLINIC_ADMIN);
};

export type AssigneeDoctorRef = {
  doctorUuid: string;
  userUuid?: string;
  role?: string;
};

/** Hide Assign doctor: personal practice, or doctor-only (not clinic admin/staff). */
export const shouldLockAssigneeDoctor = (
  roles: string[] | undefined,
  isPersonalPractice: boolean
): boolean => {
  if (hasAnyRole(roles, [ROLES.CLINIC_ADMIN, ROLES.CLINIC_STAFF])) return false;
  if (isPersonalPractice) return true;
  return hasRole(roles, ROLES.DOCTOR);
};

/** Personal: owner affiliation, else profile/self. Doctor actor: own profile or roster self. */
export const resolveLockedDoctorUuid = (args: {
  isPersonalPractice: boolean;
  viewerUserUuid?: string;
  myDoctorUuid?: string | null;
  doctors: AssigneeDoctorRef[];
}): string | undefined => {
  const { isPersonalPractice, viewerUserUuid, myDoctorUuid, doctors } = args;
  if (isPersonalPractice) {
    const owner = doctors.find((d) => d.role === 'owner' && d.doctorUuid);
    if (owner?.doctorUuid) return owner.doctorUuid;
  }
  if (myDoctorUuid) return myDoctorUuid;
  const self = doctors.find(
    (d) => !!d.userUuid && !!viewerUserUuid && d.userUuid === viewerUserUuid && d.doctorUuid
  );
  return self?.doctorUuid || undefined;
};
