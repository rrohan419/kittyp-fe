import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  matchesEmailOrGeneratedId,
  normalizeAppointmentSearchQuery,
} from './appointmentPatientSearch.ts';

describe('matchesEmailOrGeneratedId', () => {
  it('matches owner email and generated pet/owner IDs', () => {
    assert.equal(
      matchesEmailOrGeneratedId('parent@kittyp.test', 'parent@kittyp.test', 'abc-uuid'),
      true
    );
    assert.equal(matchesEmailOrGeneratedId('abc-uuid', 'parent@kittyp.test', 'abc-uuid'), true);
    assert.equal(matchesEmailOrGeneratedId('P-12', undefined, 'P-12'), true);
  });

  it('matches 6-character pet IDs regardless of case', () => {
    assert.equal(matchesEmailOrGeneratedId('6up32b', '6UP32B'), true);
    assert.equal(normalizeAppointmentSearchQuery('6up32b'), '6UP32B');
  });

  it('does not match names or short queries', () => {
    assert.equal(matchesEmailOrGeneratedId('Milo', 'parent@kittyp.test', 'abc-uuid'), false);
    assert.equal(matchesEmailOrGeneratedId('ab', 'abc-uuid'), false);
  });
});
