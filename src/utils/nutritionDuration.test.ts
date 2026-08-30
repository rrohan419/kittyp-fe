import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clampPlanDurationDays } from './nutritionDuration.ts';

describe('clampPlanDurationDays', () => {
  it('defaults missing or invalid values to 30', () => {
    assert.equal(clampPlanDurationDays(null), 30);
    assert.equal(clampPlanDurationDays(undefined), 30);
    assert.equal(clampPlanDurationDays(0), 30);
    assert.equal(clampPlanDurationDays(-4), 30);
  });

  it('keeps valid days and clamps the top end', () => {
    assert.equal(clampPlanDurationDays(7), 7);
    assert.equal(clampPlanDurationDays(14), 14);
    assert.equal(clampPlanDurationDays(120), 90);
  });
});
