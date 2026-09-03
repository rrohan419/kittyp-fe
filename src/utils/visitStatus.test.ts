import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { startOfDay } from 'date-fns';
import {
  buildAttendedPetUuids,
  filterClinicUrgentToday,
  filterUrgentAttentionQueue,
  isAttendedCalendarVisit,
  isAttendedVisitStatus,
  isCalendarExcludedStatus,
  isTerminalVisitStatus,
  isUrgentDashboardVisit,
  isUrgentQueueStatus,
  isVisitOnDay,
  visitScheduleInstant,
} from './visitStatus.ts';

describe('isUrgentDashboardVisit', () => {
  it('queue statuses only', () => {
    assert.equal(isUrgentDashboardVisit('WAITLIST'), true);
    assert.equal(isUrgentDashboardVisit('CHECKED_IN'), true);
    assert.equal(isUrgentDashboardVisit('IN_PROGRESS'), false);
    assert.equal(isUrgentDashboardVisit('COMPLETED'), false);
  });
});

describe('isAttendedVisitStatus', () => {
  it('active or finished care', () => {
    assert.equal(isAttendedVisitStatus('IN_PROGRESS'), true);
    assert.equal(isAttendedVisitStatus('CHECKING_OUT'), true);
    assert.equal(isAttendedVisitStatus('COMPLETED'), true);
    assert.equal(isAttendedVisitStatus('WAITLIST'), false);
  });
});

describe('filterUrgentAttentionQueue', () => {
  const base = [
    { uuid: '1', urgency: 'URGENT', status: 'WAITLIST', petUuid: 'p1' },
    { uuid: '2', urgency: 'ROUTINE', status: 'WAITLIST', petUuid: 'p2' },
    { uuid: '3', urgency: 'URGENT', status: 'IN_PROGRESS', petUuid: 'p3' },
    { uuid: '4', urgency: 'URGENT', status: 'WAITLIST', petUuid: 'p3' },
  ];

  it('keeps urgent waitlist and drops attended pet duplicates', () => {
    const filtered = filterUrgentAttentionQueue(base);
    assert.deepEqual(
      filtered.map((v) => v.uuid),
      ['1']
    );
  });

  it('isUrgentQueueStatus matches dashboard queue', () => {
    assert.equal(isUrgentQueueStatus('CHECKED_IN'), true);
    assert.equal(isUrgentQueueStatus('CANCELLED'), false);
  });

  it('buildAttendedPetUuids collects pets in active or done states', () => {
    const attended = buildAttendedPetUuids(base);
    assert.equal(attended.has('p3'), true);
    assert.equal(attended.has('p1'), false);
  });
});

describe('filterClinicUrgentToday', () => {
  const today = startOfDay(new Date('2026-08-30T12:00:00'));

  it('includes in-progress urgent and excludes terminal', () => {
    const visits = [
      {
        uuid: 'a',
        urgency: 'URGENT',
        status: 'IN_PROGRESS',
        createdAt: '2026-08-30T10:00:00',
      },
      {
        uuid: 'b',
        urgency: 'URGENT',
        status: 'COMPLETED',
        createdAt: '2026-08-30T11:00:00',
      },
      {
        uuid: 'c',
        urgency: 'ROUTINE',
        status: 'WAITLIST',
        createdAt: '2026-08-30T09:00:00',
      },
    ];
    const filtered = filterClinicUrgentToday(visits, today);
    assert.deepEqual(
      filtered.map((v) => v.uuid),
      ['a']
    );
  });
});

describe('visitScheduleInstant', () => {
  it('prefers startedAt over createdAt', () => {
    const d = visitScheduleInstant({
      startedAt: '2026-08-30T15:00:00',
      createdAt: '2026-08-30T10:00:00',
    });
    assert.ok(d);
    assert.equal(d!.getHours(), 15);
  });
});

describe('isVisitOnDay', () => {
  const today = startOfDay(new Date('2026-08-30T12:00:00'));

  it('matches via createdAt fallback', () => {
    assert.equal(
      isVisitOnDay({ createdAt: '2026-08-30T22:30:00' }, today),
      true
    );
    assert.equal(
      isVisitOnDay({ createdAt: '2026-08-29T22:30:00' }, today),
      false
    );
  });
});

describe('isTerminalVisitStatus', () => {
  it('flags completed cancelled no_show', () => {
    assert.equal(isTerminalVisitStatus('COMPLETED'), true);
    assert.equal(isTerminalVisitStatus('IN_PROGRESS'), false);
  });
});

describe('isCalendarExcludedStatus', () => {
  it('hides cancelled and no_show only', () => {
    assert.equal(isCalendarExcludedStatus('CANCELLED'), true);
    assert.equal(isCalendarExcludedStatus('NO_SHOW'), true);
    assert.equal(isCalendarExcludedStatus('COMPLETED'), false);
    assert.equal(isCalendarExcludedStatus('IN_PROGRESS'), false);
  });
});

describe('isAttendedCalendarVisit', () => {
  it('flags completed and checking out', () => {
    assert.equal(isAttendedCalendarVisit('COMPLETED'), true);
    assert.equal(isAttendedCalendarVisit('CHECKING_OUT'), true);
    assert.equal(isAttendedCalendarVisit('WAITLIST'), false);
  });
});
