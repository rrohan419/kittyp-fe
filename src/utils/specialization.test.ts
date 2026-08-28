import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { specializationLabel } from './specialization.ts';

describe('specializationLabel', () => {
  it('maps NUROLOGY to Neurology', () => {
    assert.equal(specializationLabel('NUROLOGY'), 'Neurology');
  });

  it('keeps known labels and falls back for unknown enums', () => {
    assert.equal(specializationLabel('SURGERY'), 'Surgery');
    assert.equal(specializationLabel('ZOO_MEDICINE'), 'ZOO MEDICINE');
  });

  it('returns empty for blank', () => {
    assert.equal(specializationLabel(''), '');
    assert.equal(specializationLabel(null), '');
  });
});
