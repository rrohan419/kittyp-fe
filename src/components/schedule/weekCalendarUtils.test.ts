import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addDays, addMinutes, setHours, setMinutes, setSeconds, startOfDay } from 'date-fns';
import {
  isFutureBookableSlot,
  weekHasFutureBookableSlots,
} from './weekCalendarLayout.ts';
import {
  filterPracticeWeekEvents,
  resolveEventDoctorUuid,
} from './weekCalendarPractice.ts';

describe('resolveEventDoctorUuid', () => {
  it('prefers event envelope then visit then booking then fallback', () => {
    assert.equal(resolveEventDoctorUuid({ doctorUuid: 'a' }), 'a');
    assert.equal(resolveEventDoctorUuid({ visit: { doctorUuid: 'b' } }), 'b');
    assert.equal(resolveEventDoctorUuid({ booking: { doctorUuid: 'c' } }), 'c');
    assert.equal(resolveEventDoctorUuid({}, 'fallback'), 'fallback');
  });
});

describe('filterPracticeWeekEvents', () => {
  const clinicA = 'clinic-a';
  const clinicB = 'clinic-b';
  const ev = (clinicUuid?: string) => ({ visit: { clinicUuid } });

  it('returns all when no active clinic', () => {
    const events = [ev(clinicA), ev(clinicB)];
    assert.equal(filterPracticeWeekEvents(events, null, false).length, 2);
  });

  it('filters to active clinic for affiliated practice', () => {
    const events = [ev(clinicA), ev(clinicB)];
    const filtered = filterPracticeWeekEvents(events, clinicA, false);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].visit?.clinicUuid, clinicA);
  });

  it('personal practice keeps unassigned and own clinic', () => {
    const events = [ev(undefined), ev(clinicA), ev(clinicB)];
    const filtered = filterPracticeWeekEvents(events, clinicA, true);
    assert.equal(filtered.length, 2);
  });
});

describe('isFutureBookableSlot', () => {
  it('rejects past and equal-to-now slots', () => {
    const now = new Date('2026-08-30T14:00:00');
    assert.equal(isFutureBookableSlot(new Date('2026-08-30T13:30:00'), now), false);
    assert.equal(isFutureBookableSlot(now, now), false);
  });

  it('accepts future slots', () => {
    const now = new Date('2026-08-30T14:00:00');
    assert.equal(isFutureBookableSlot(addMinutes(now, 1), now), true);
    assert.equal(isFutureBookableSlot(new Date('2026-08-31T09:00:00'), now), true);
  });
});

describe('weekHasFutureBookableSlots', () => {
  const hourRange = { startHour: 9, endHour: 17 };

  it('false for an entirely past week', () => {
    const now = new Date('2026-08-30T14:00:00');
    const monday = startOfDay(new Date('2026-08-18T09:00:00'));
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    assert.equal(weekHasFutureBookableSlots(weekDays, hourRange, now), false);
  });

  it('true when the current week still has a future slot today', () => {
    const now = new Date('2026-08-30T14:00:00');
    const monday = startOfDay(new Date('2026-08-25T09:00:00'));
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    assert.equal(weekHasFutureBookableSlots(weekDays, hourRange, now), true);
  });

  it('false when the current week has no remaining business-hour slots', () => {
    const now = new Date('2026-08-31T18:00:00');
    const monday = startOfDay(new Date('2026-08-25T09:00:00'));
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    assert.equal(weekHasFutureBookableSlots(weekDays, hourRange, now), false);
  });

  it('true for a fully future week', () => {
    const now = new Date('2026-08-30T14:00:00');
    const monday = startOfDay(new Date('2026-09-01T09:00:00'));
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    assert.equal(weekHasFutureBookableSlots(weekDays, hourRange, now), true);
  });

  it('respects hour range boundaries', () => {
    const now = new Date('2026-08-30T11:00:00');
    const today = startOfDay(now);
    const narrowRange = { startHour: 10, endHour: 11 };
    assert.equal(weekHasFutureBookableSlots([today], narrowRange, now), false);
    const slot1030 = setSeconds(setMinutes(setHours(today, 10), 30), 0);
    assert.equal(isFutureBookableSlot(slot1030, now), false);
  });
});
