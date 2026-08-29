import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canInviteDoctors, canManageClinicOps, canSwitchWorkspace, getPortalHome, isSignupRole, PUBLIC_SIGNUP_PATHS, ROLES, SIGNUP_ROLES, SIGNUP_ROLE_LABELS } from './roles.ts';

describe('signup role allowlist', () => {
  it('only allows USER, DOCTOR, CLINIC', () => {
    assert.deepEqual([...SIGNUP_ROLES], ['USER', 'DOCTOR', 'CLINIC']);
    assert.equal(isSignupRole('USER'), true);
    assert.equal(isSignupRole('DOCTOR'), true);
    assert.equal(isSignupRole('CLINIC'), true);
  });

  it('rejects elevated and unknown roles in the query/toggle parser', () => {
    const rejected = [
      'ROLE_ADMIN',
      'ADMIN',
      'ROLE_MODERATOR',
      'ROLE_CLINIC_STAFF',
      'ROLE_USER',
      'ROLE_DOCTOR',
      'ROLE_CLINIC_ADMIN',
      'staff',
      '',
      null,
      undefined,
    ];
    for (const value of rejected) {
      assert.equal(isSignupRole(value), false, String(value));
    }
  });

  it('does not expose admin labels on the signup toggle', () => {
    assert.deepEqual(Object.keys(SIGNUP_ROLE_LABELS).sort(), ['CLINIC', 'DOCTOR', 'USER']);
    assert.equal(SIGNUP_ROLE_LABELS.USER, 'Pet parent');
    assert.equal(SIGNUP_ROLE_LABELS.DOCTOR, 'Doctor');
    assert.equal(SIGNUP_ROLE_LABELS.CLINIC, 'Clinic');
  });

  it('exposes three public signup paths', () => {
    assert.deepEqual(
      PUBLIC_SIGNUP_PATHS.map((item) => item.to),
      ['/signup', '/signup/doctor', '/signup/clinic-admin']
    );
  });
});

describe('canSwitchWorkspace', () => {
  it('treats clinic admin and staff as one portal', () => {
    assert.equal(canSwitchWorkspace([ROLES.CLINIC_ADMIN, ROLES.CLINIC_STAFF]), false);
  });

  it('allows switching when doctor and pet parent portals both exist', () => {
    assert.equal(canSwitchWorkspace([ROLES.DOCTOR, ROLES.USER]), true);
  });

  it('does not switch for a doctor-only account', () => {
    assert.equal(canSwitchWorkspace([ROLES.DOCTOR]), false);
  });
});

describe('clinic staff landing and ops', () => {
  it('sends staff to appointments, not the clinic dashboard', () => {
    assert.equal(getPortalHome([ROLES.CLINIC_STAFF]), '/clinic/appointments');
    assert.equal(getPortalHome([ROLES.CLINIC_ADMIN]), '/clinic');
  });

  it('lets only clinic admins invite doctors', () => {
    assert.equal(canInviteDoctors([ROLES.CLINIC_ADMIN]), true);
    assert.equal(canInviteDoctors([ROLES.CLINIC_STAFF]), false);
    assert.equal(canInviteDoctors([ROLES.DOCTOR]), false);
  });

  it('lets staff and admin run clinic ops', () => {
    assert.equal(canManageClinicOps([ROLES.CLINIC_STAFF]), true);
    assert.equal(canManageClinicOps([ROLES.CLINIC_ADMIN]), true);
    assert.equal(canManageClinicOps([ROLES.DOCTOR]), false);
  });
});
