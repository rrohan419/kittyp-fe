import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import { ROLES } from './roles.ts';
import {
  clearWorkspaceMemory,
  pathForWorkspaceRole,
  rememberWorkspacePath,
  workspaceKey,
} from './workspaceMemory.ts';

describe('workspace memory', () => {
  beforeEach(() => {
    clearWorkspaceMemory();
  });

  it('keeps each portal path and ignores the chooser', () => {
    rememberWorkspacePath('/doctor/settings', '?tab=profile', '#bio');
    rememberWorkspacePath('/clinic/invoices', '', '');
    rememberWorkspacePath('/app/pets/abc', '', '');
    rememberWorkspacePath('/select-role', '?choose=1', '');

    assert.equal(workspaceKey('/select-role'), null);
    assert.equal(pathForWorkspaceRole(ROLES.DOCTOR), '/doctor/settings?tab=profile#bio');
    assert.equal(pathForWorkspaceRole(ROLES.CLINIC_ADMIN), '/clinic/invoices');
    assert.equal(pathForWorkspaceRole(ROLES.CLINIC_STAFF), '/clinic/invoices');
    assert.equal(pathForWorkspaceRole(ROLES.USER), '/app/pets/abc');
  });

  it('returns to the last page of a portal after visiting the others', () => {
    rememberWorkspacePath('/doctor/patients/pet-1', '', '');
    rememberWorkspacePath('/clinic/appointments', '', '');
    rememberWorkspacePath('/app/health', '', '');
    rememberWorkspacePath('/doctor/patients/pet-1', '', '');

    assert.equal(pathForWorkspaceRole(ROLES.DOCTOR), '/doctor/patients/pet-1');
    assert.equal(pathForWorkspaceRole(ROLES.CLINIC_ADMIN), '/clinic/appointments');
    assert.equal(pathForWorkspaceRole(ROLES.USER), '/app/health');
  });

  it('drops remembered pages on logout so the next account starts clean', () => {
    rememberWorkspacePath('/doctor/blog/new', '', '');
    clearWorkspaceMemory();
    assert.equal(pathForWorkspaceRole(ROLES.DOCTOR), null);
  });
});
