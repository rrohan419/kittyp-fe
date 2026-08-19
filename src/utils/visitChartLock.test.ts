import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canEditVisitChart, PRESCRIPTION_EDIT_MS } from './visitChartLock.ts';
import type { ClinicVisitModel } from '../services/clinicService.ts';

function visit(partial: Partial<ClinicVisitModel>): ClinicVisitModel {
  return {
    uuid: 'v1',
    clinicUuid: 'c1',
    petUuid: 'p1',
    petName: 'Coco',
    source: 'WALK_IN',
    channel: 'IN_PERSON',
    status: 'IN_PROGRESS',
    urgency: 'ROUTINE',
    ...partial,
  };
}

describe('canEditVisitChart', () => {
  it('allows in-progress visits', () => {
    assert.equal(canEditVisitChart(visit({ status: 'IN_PROGRESS' })), true);
  });

  it('allows checkout within one hour', () => {
    const checkingOutAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    assert.equal(canEditVisitChart(visit({ status: 'CHECKING_OUT', checkingOutAt })), true);
  });

  it('locks checkout after one hour', () => {
    const checkingOutAt = new Date(Date.now() - PRESCRIPTION_EDIT_MS - 1000).toISOString();
    assert.equal(canEditVisitChart(visit({ status: 'CHECKING_OUT', checkingOutAt })), false);
  });

  it('locks completed after one hour from checkout', () => {
    const checkingOutAt = new Date(Date.now() - PRESCRIPTION_EDIT_MS - 1000).toISOString();
    assert.equal(canEditVisitChart(visit({ status: 'COMPLETED', checkingOutAt })), false);
  });

  it('allows completed within one hour of checkout', () => {
    const checkingOutAt = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    assert.equal(canEditVisitChart(visit({ status: 'COMPLETED', checkingOutAt })), true);
  });
});
