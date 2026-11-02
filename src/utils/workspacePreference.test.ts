import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { ROLES } from './roles.ts';
import {
  getDefaultClinicId,
  getLastClinicId,
  resolvePostLoginTarget,
  saveLastWorkspace,
  setDefaultClinicId,
} from './workspacePreference.ts';

const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  },
  configurable: true,
});
Object.defineProperty(globalThis, 'sessionStorage', {
  value: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
  configurable: true,
});

const both = [ROLES.USER, ROLES.DOCTOR];

describe('post-login target', () => {
  beforeEach(() => store.clear());

  it('pet parent goes to /app', () => {
    assert.deepEqual(resolvePostLoginTarget([ROLES.USER], 'u1'), { role: ROLES.USER, path: '/app' });
  });

  it('remembers the last workspace for the same user only', () => {
    saveLastWorkspace('u1', { role: ROLES.USER });
    assert.equal(resolvePostLoginTarget(both, 'u1')?.path, '/app');
    assert.equal(resolvePostLoginTarget(both, 'u2')?.path, '/doctor');
  });

  it('ignores a stale remembered role', () => {
    saveLastWorkspace('u1', { role: ROLES.CLINIC_ADMIN });
    assert.equal(resolvePostLoginTarget(both, 'u1')?.role, ROLES.DOCTOR);
  });

  it('ignores public and cross-portal redirects, keeps in-portal ones', () => {
    assert.equal(resolvePostLoginTarget(both, 'u1', '/')?.path, '/doctor');
    assert.equal(resolvePostLoginTarget(both, 'u1', '/blog')?.path, '/doctor');
    assert.equal(resolvePostLoginTarget(both, 'u1', '/clinic/patients')?.path, '/doctor');
    assert.equal(resolvePostLoginTarget(both, 'u1', '/doctorx')?.path, '/doctor');
    assert.equal(resolvePostLoginTarget(both, 'u1', '/doctor/appointments?a=1')?.path, '/doctor/appointments?a=1');
  });

  it('keeps each account\'s defaults when switching accounts', () => {
    setDefaultClinicId('a', 'clinic', 'branch-a');
    setDefaultClinicId('b', 'clinic', 'branch-b');
    saveLastWorkspace('b', { role: ROLES.USER });
    assert.equal(getDefaultClinicId('a', 'clinic'), 'branch-a');
    assert.equal(getDefaultClinicId('b', 'clinic'), 'branch-b');
  });

  it('remembers clinic per portal', () => {
    saveLastWorkspace('u1', { portal: 'doctor', clinicId: 'personal-1' });
    saveLastWorkspace('u1', { portal: 'clinic', clinicId: 'branch-1' });
    assert.equal(getLastClinicId('u1', 'doctor'), 'personal-1');
    assert.equal(getLastClinicId('u1', 'clinic'), 'branch-1');
    assert.equal(getLastClinicId('u2', 'doctor'), null);
  });

  it('default clinic is per portal, survives last-clinic updates, and can be cleared', () => {
    setDefaultClinicId('u1', 'clinic', 'branch-2');
    saveLastWorkspace('u1', { portal: 'clinic', clinicId: 'branch-1' });
    assert.equal(getDefaultClinicId('u1', 'clinic'), 'branch-2');
    assert.equal(getDefaultClinicId('u1', 'doctor'), null);
    assert.equal(getDefaultClinicId('u2', 'clinic'), null);
    setDefaultClinicId('u1', 'clinic', null);
    assert.equal(getDefaultClinicId('u1', 'clinic'), null);
  });
});
