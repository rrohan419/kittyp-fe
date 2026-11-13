import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canEditVisitChart } from './visitChartLock.ts';
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

  it('locks checkout immediately after treatment is finished', () => {
    assert.equal(canEditVisitChart(visit({ status: 'CHECKING_OUT' })), false);
  });

  it('locks completed visits', () => {
    assert.equal(canEditVisitChart(visit({ status: 'COMPLETED' })), false);
  });
});
