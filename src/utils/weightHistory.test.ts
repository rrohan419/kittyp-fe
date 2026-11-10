import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toWeightHistory } from './weightHistory.ts';
import { isValidWeight } from './weightValidation.ts';

describe('weight history', () => {
  it('orders measurements chronologically, preserving visit and recorder details', () => {
    const weights = [
      { id: 3, weight: 5, recordedAt: '2026-02-01T10:00:00', recordedBy: 'Doctor',
        visitUuid: 'visit-1', note: 'Doctor visit', correctedBy: 'Other doctor',
        correctedAt: '2026-02-01T11:00:00' },
      { id: 2, weight: 4, recordedAt: '2026-01-01T10:00:00' },
      { id: 1, weight: 3, recordedAt: '2026-01-01T10:00:00' },
    ];
    const result = toWeightHistory(weights);
    assert.deepEqual(result.map((entry) => entry.id), [1, 2, 3]);
    assert.equal(result[2].recordedBy, 'Doctor');
    assert.equal(result[2].visitUuid, 'visit-1');
    assert.equal(result[2].correctedBy, 'Other doctor');
    assert.equal(result[2].date, '2026-02-01T10:00:00');
    assert.equal(weights[0].id, 3);
  });

  it('accepts only positive finite weights', () => {
    assert.equal(isValidWeight('4.25'), true);
    for (const value of ['', ' ', '0', '-1', 'NaN', 'Infinity', '1kg']) {
      assert.equal(isValidWeight(value), false, value);
    }
  });
});
