import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSignupRole, SIGNUP_ROLES, SIGNUP_ROLE_LABELS } from './roles.ts';

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
  });
});
