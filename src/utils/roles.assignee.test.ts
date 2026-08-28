import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ROLES,
  resolveLockedDoctorUuid,
  shouldLockAssigneeDoctor,
  type AssigneeDoctorRef,
} from './roles.ts';

const owner: AssigneeDoctorRef = {
  doctorUuid: 'owner-doc',
  userUuid: 'owner-user',
  role: 'owner',
};
const self: AssigneeDoctorRef = {
  doctorUuid: 'self-doc',
  userUuid: 'self-user',
  role: 'doctor',
};
const other: AssigneeDoctorRef = {
  doctorUuid: 'other-doc',
  userUuid: 'other-user',
  role: 'doctor',
};

describe('shouldLockAssigneeDoctor', () => {
  it('does not lock clinic admin or staff even on personal practice', () => {
    assert.equal(shouldLockAssigneeDoctor([ROLES.CLINIC_ADMIN], true), false);
    assert.equal(shouldLockAssigneeDoctor([ROLES.CLINIC_STAFF], true), false);
    assert.equal(
      shouldLockAssigneeDoctor([ROLES.DOCTOR, ROLES.CLINIC_ADMIN], true),
      false
    );
  });

  it('locks doctor on personal practice', () => {
    assert.equal(shouldLockAssigneeDoctor([ROLES.DOCTOR], true), true);
  });

  it('locks doctor-only on a non-personal clinic', () => {
    assert.equal(shouldLockAssigneeDoctor([ROLES.DOCTOR], false), true);
  });

  it('keeps picker for clinic admin or staff on a non-personal clinic', () => {
    assert.equal(shouldLockAssigneeDoctor([ROLES.CLINIC_ADMIN], false), false);
    assert.equal(shouldLockAssigneeDoctor([ROLES.CLINIC_STAFF], false), false);
    assert.equal(
      shouldLockAssigneeDoctor([ROLES.DOCTOR, ROLES.CLINIC_ADMIN], false),
      false
    );
  });

  it('does not lock when roles are missing on a non-personal clinic', () => {
    assert.equal(shouldLockAssigneeDoctor(undefined, false), false);
  });
});

describe('resolveLockedDoctorUuid', () => {
  it('prefers owner affiliation on personal practice', () => {
    assert.equal(
      resolveLockedDoctorUuid({
        isPersonalPractice: true,
        viewerUserUuid: 'self-user',
        myDoctorUuid: 'self-doc',
        doctors: [other, owner, self],
      }),
      'owner-doc'
    );
  });

  it('falls back to myDoctorUuid then roster self on personal practice', () => {
    assert.equal(
      resolveLockedDoctorUuid({
        isPersonalPractice: true,
        viewerUserUuid: 'self-user',
        myDoctorUuid: 'profile-doc',
        doctors: [self, other],
      }),
      'profile-doc'
    );
    assert.equal(
      resolveLockedDoctorUuid({
        isPersonalPractice: true,
        viewerUserUuid: 'self-user',
        myDoctorUuid: null,
        doctors: [self, other],
      }),
      'self-doc'
    );
  });

  it('uses myDoctorUuid then roster self for a doctor actor', () => {
    assert.equal(
      resolveLockedDoctorUuid({
        isPersonalPractice: false,
        viewerUserUuid: 'self-user',
        myDoctorUuid: 'profile-doc',
        doctors: [self, other],
      }),
      'profile-doc'
    );
    assert.equal(
      resolveLockedDoctorUuid({
        isPersonalPractice: false,
        viewerUserUuid: 'self-user',
        myDoctorUuid: null,
        doctors: [self, other],
      }),
      'self-doc'
    );
  });

  it('returns undefined when nothing matches', () => {
    assert.equal(
      resolveLockedDoctorUuid({
        isPersonalPractice: false,
        viewerUserUuid: 'nobody',
        myDoctorUuid: null,
        doctors: [other],
      }),
      undefined
    );
  });
});
