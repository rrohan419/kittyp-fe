import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clinicTodayIso, formatClinicTodayLong } from './clinicDay.ts';

describe('clinicDay Asia/Kolkata', () => {
  it('formats civil date in Kolkata for a UTC evening that is next day in IST', () => {
    // 2026-09-05 20:30 UTC == 2026-09-06 02:00 IST
    const utcEvening = new Date('2026-09-05T20:30:00.000Z');
    assert.equal(clinicTodayIso('Asia/Kolkata', utcEvening), '2026-09-06');
    assert.match(formatClinicTodayLong('Asia/Kolkata', utcEvening), /6 September/);
  });

  it('keeps same civil day for mid-day Kolkata', () => {
    const mid = new Date('2026-09-06T06:30:00.000Z'); // 12:00 IST
    assert.equal(clinicTodayIso('Asia/Kolkata', mid), '2026-09-06');
  });
});
