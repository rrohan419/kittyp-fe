import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  notesFromVisits,
  prescriptionsFromVisits,
  vitalsFromVisits,
  type VisitPrescriptionSource,
} from './prescriptionsFromVisits.ts';

const older: VisitPrescriptionSource = {
  uuid: 'v-old',
  completedAt: '2026-01-01T10:00:00.000Z',
  doctorName: 'Dr. Old',
  chart: { plan: 'Amox 50mg' },
};

const newer: VisitPrescriptionSource = {
  uuid: 'v-new',
  completedAt: '2026-03-01T10:00:00.000Z',
  doctorName: 'Dr. New',
  chart: { plan: 'Metro 10mg' },
};

describe('prescriptionsFromVisits', () => {
  it('keeps non-empty plans, newest first', () => {
    const rows = prescriptionsFromVisits([older, newer, { uuid: 'blank', chart: { plan: '  ' } }]);
    assert.deepEqual(
      rows.map((r) => r.visitUuid),
      ['v-new', 'v-old']
    );
    assert.equal(rows[0].plan, 'Metro 10mg');
    assert.equal(rows[0].bookingId, 'v-new');
  });

  it('excludes the current visit uuid', () => {
    const rows = prescriptionsFromVisits([older, newer], 'v-new');
    assert.deepEqual(
      rows.map((r) => r.visitUuid),
      ['v-old']
    );
  });

  it('skips visits without a plan', () => {
    assert.deepEqual(prescriptionsFromVisits([{ uuid: 'none', chart: {} }]), []);
    assert.deepEqual(prescriptionsFromVisits([{ uuid: 'null', chart: { plan: null } }]), []);
  });
});

describe('vitalsFromVisits', () => {
  it('keeps visits with weight or temperature', () => {
    const rows = vitalsFromVisits([
      { uuid: 'a', completedAt: '2026-02-01T00:00:00.000Z', chart: { vitals: { weightKg: 4.2 } } },
      { uuid: 'b', chart: { vitals: {} } },
      { uuid: 'c', startedAt: '2026-03-01T00:00:00.000Z', chart: { vitals: { temperatureC: 38.5 } } },
    ]);
    assert.deepEqual(
      rows.map((r) => r.visitUuid),
      ['c', 'a']
    );
    assert.equal(rows[1].weightKg, '4.2');
  });
});

describe('notesFromVisits', () => {
  it('keeps visits with any note field', () => {
    const rows = notesFromVisits([
      { uuid: 'a', chart: { assessment: 'URI' } },
      { uuid: 'b', chart: { examinationNotes: '  ' } },
      { uuid: 'c', chart: { internalNotes: 'watch appetite' } },
    ]);
    assert.equal(rows.length, 2);
    assert.deepEqual(
      rows.map((r) => r.visitUuid).sort(),
      ['a', 'c']
    );
  });
});
