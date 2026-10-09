import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ACCOUNT_EXISTS_MESSAGE,
  classifyExistingRoles,
  duplicateRoleMessage,
  isAccountExistsMessage,
  postLoginPath,
  sessionHasActivatedRole,
} from './roleActivation.ts';
import { ROLES } from './roles.ts';

describe('role activation', () => {
  it('uses a 409 message that does not name a role', () => {
    assert.equal(isAccountExistsMessage(ACCOUNT_EXISTS_MESSAGE), true);
    assert.equal(ACCOUNT_EXISTS_MESSAGE.toLowerCase().includes('doctor'), false);
    assert.equal(ACCOUNT_EXISTS_MESSAGE.toLowerCase().includes('admin'), false);
    assert.equal(isAccountExistsMessage('User already exists with email : doctor@example.com'), false);
  });

  it('allows one pet parent, one doctor, and one clinic on the same email', () => {
    assert.equal(classifyExistingRoles([ROLES.USER], 'DOCTOR'), 'available');
    assert.equal(classifyExistingRoles([ROLES.USER], 'CLINIC'), 'available');
    assert.equal(classifyExistingRoles([ROLES.DOCTOR], 'USER'), 'available');
    assert.equal(classifyExistingRoles([ROLES.CLINIC_ADMIN], 'USER'), 'available');
    assert.equal(classifyExistingRoles([ROLES.USER, ROLES.DOCTOR], 'CLINIC'), 'available');
    assert.equal(classifyExistingRoles([ROLES.USER], 'USER'), 'duplicate');
    assert.equal(classifyExistingRoles([ROLES.DOCTOR], 'DOCTOR'), 'duplicate');
    assert.equal(classifyExistingRoles([ROLES.CLINIC_ADMIN], 'CLINIC'), 'duplicate');
    assert.match(duplicateRoleMessage('DOCTOR'), /doctor account/);
    assert.match(duplicateRoleMessage('USER'), /pet parent account/);
    assert.match(duplicateRoleMessage('CLINIC'), /clinic account/);
  });

  it('sends an add-role login to that signup form and leaves ordinary login alone', () => {
    assert.equal(postLoginPath('USER'), '/signup?role=USER');
    assert.equal(postLoginPath('DOCTOR'), '/signup?role=DOCTOR');
    assert.equal(postLoginPath('CLINIC'), '/signup?role=CLINIC');
    assert.equal(postLoginPath(null), null);
  });

  it('allows navigation only when every stored role list includes the new role', () => {
    assert.equal(
      sessionHasActivatedRole([ROLES.DOCTOR, ROLES.USER], [ROLES.DOCTOR, ROLES.USER], [ROLES.DOCTOR, ROLES.USER], 'USER'),
      true,
    );
    assert.equal(
      sessionHasActivatedRole([ROLES.DOCTOR], [ROLES.DOCTOR, ROLES.USER], [ROLES.DOCTOR, ROLES.USER], 'USER'),
      false,
    );
    assert.equal(
      sessionHasActivatedRole([ROLES.DOCTOR, ROLES.USER], [ROLES.DOCTOR], [ROLES.DOCTOR, ROLES.USER], 'USER'),
      false,
    );
    assert.equal(
      sessionHasActivatedRole([ROLES.DOCTOR, ROLES.USER], [ROLES.DOCTOR, ROLES.USER], [ROLES.DOCTOR], 'USER'),
      false,
    );
  });
});
