import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ROLES } from './roles.ts';
import { roleFromLogin } from './roleFromLogin.ts';

describe('roleFromLogin', () => {
  const roles = [ROLES.USER, ROLES.DOCTOR, ROLES.CLINIC_ADMIN];

  it('opens the role whose password matched, ahead of the preferred doctor portal', () => {
    assert.equal(roleFromLogin(roles, ROLES.USER), ROLES.USER);
    assert.equal(roleFromLogin(roles, ROLES.CLINIC_ADMIN), ROLES.CLINIC_ADMIN);
  });

  it('returns null when login did not name a unique role', () => {
    assert.equal(roleFromLogin(roles, null), null);
    assert.equal(roleFromLogin(roles, undefined), null);
    assert.equal(roleFromLogin(roles, ''), null);
  });

  it('ignores a login role the account does not have', () => {
    assert.equal(roleFromLogin([ROLES.USER], ROLES.DOCTOR), null);
  });
});
