import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canViewDoctorCertificates, ROLES } from './roles.ts';

describe('canViewDoctorCertificates', () => {
  it('allows clinic admin for another doctor only in clinic-admin context', () => {
    assert.equal(
      canViewDoctorCertificates([ROLES.CLINIC_ADMIN], 'admin-uuid', 'other-doctor-uuid', true),
      true
    );
  });

  it('denies clinic admin JWT on doctor portal for a colleague', () => {
    assert.equal(
      canViewDoctorCertificates(
        [ROLES.DOCTOR, ROLES.CLINIC_ADMIN],
        'doc-uuid',
        'other-doctor-uuid',
        false
      ),
      false
    );
  });

  it('allows a doctor viewing their own profile on either portal', () => {
    assert.equal(
      canViewDoctorCertificates([ROLES.DOCTOR], 'doc-uuid', 'doc-uuid', false),
      true
    );
    assert.equal(
      canViewDoctorCertificates([ROLES.DOCTOR, ROLES.CLINIC_ADMIN], 'doc-uuid', 'doc-uuid', true),
      true
    );
  });

  it('denies clinic staff viewing another doctor', () => {
    assert.equal(
      canViewDoctorCertificates([ROLES.CLINIC_STAFF], 'staff-uuid', 'doctor-uuid', true),
      false
    );
  });

  it('denies a doctor viewing a colleague', () => {
    assert.equal(
      canViewDoctorCertificates([ROLES.DOCTOR], 'doc-a', 'doc-b', false),
      false
    );
    assert.equal(
      canViewDoctorCertificates([ROLES.DOCTOR], 'doc-a', 'doc-b', true),
      false
    );
  });

  it('denies when viewer or profile uuid is missing', () => {
    assert.equal(canViewDoctorCertificates([ROLES.DOCTOR], undefined, 'doc-uuid', false), false);
    assert.equal(canViewDoctorCertificates([ROLES.DOCTOR], 'doc-uuid', undefined, false), false);
  });

  it('allows own profile even if roles are absent', () => {
    assert.equal(canViewDoctorCertificates(undefined, 'doc-uuid', 'doc-uuid', false), true);
  });
});
