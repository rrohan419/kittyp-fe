import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { setHours, setMinutes, setSeconds, startOfDay } from 'date-fns';
import { HOUR_PX, eventLayout, visibleHourRange, withLanes } from './weekCalendarLayout.ts';

function at(day: Date, hour: number, minute = 0) {
  return setSeconds(setMinutes(setHours(day, hour), minute), 0);
}

describe('withLanes', () => {
  it('gives a chain of overlaps the same laneCount', () => {
    const day = startOfDay(new Date('2026-08-19T00:00:00'));
    const a = { id: 'a', start: at(day, 9, 0), end: at(day, 9, 30) };
    const b = { id: 'b', start: at(day, 9, 15), end: at(day, 9, 45) };
    const c = { id: 'c', start: at(day, 9, 30), end: at(day, 10, 0) };
    const lanes = withLanes([a, b, c]);
    const counts = new Set(lanes.map((e) => e.laneCount));
    assert.equal(counts.size, 1);
    assert.equal(lanes[0].laneCount, 2);
    const laneSet = new Set(lanes.map((e) => e.lane));
    assert.equal(laneSet.size, 2);
  });

  it('does not treat back-to-back 30-min slots as overlap', () => {
    const day = startOfDay(new Date('2026-08-19T00:00:00'));
    const a = { id: 'a', start: at(day, 9, 0), end: at(day, 9, 30) };
    const b = { id: 'b', start: at(day, 9, 30), end: at(day, 10, 0) };
    const lanes = withLanes([a, b]);
    assert.equal(lanes[0].laneCount, 1);
    assert.equal(lanes[1].laneCount, 1);
    assert.equal(lanes[0].lane, 0);
    assert.equal(lanes[1].lane, 0);
  });
});

describe('eventLayout', () => {
  it('keeps 30-min height inside the slot so neighbors do not overlap', () => {
    const day = startOfDay(new Date('2026-08-19T00:00:00'));
    const first = {
      start: at(day, 9, 0),
      end: at(day, 9, 30),
      lane: 0,
      laneCount: 1,
    };
    const second = {
      start: at(day, 9, 30),
      end: at(day, 10, 0),
      lane: 0,
      laneCount: 1,
    };
    const a = eventLayout(first, day);
    const b = eventLayout(second, day);
    assert.ok(a);
    assert.ok(b);
    assert.equal(a.height + 2, (30 / 60) * HOUR_PX);
    assert.ok(a.top + a.height <= b.top);
  });

  it('does not park overnight events in the 8 AM row', () => {
    const day = startOfDay(new Date('2026-08-19T00:00:00'));
    const midnight = {
      start: at(day, 0, 12),
      end: at(day, 0, 42),
      lane: 0,
      laneCount: 1,
    };
    assert.equal(eventLayout(midnight, day), null);
    const placed = eventLayout(midnight, day, { startHour: 0, endHour: 20 });
    assert.ok(placed);
    assert.equal(placed.top, (12 / 60) * HOUR_PX);
  });
});

describe('visibleHourRange', () => {
  it('opens at midnight when a visit starts before clinic hours', () => {
    const day = startOfDay(new Date('2026-08-19T00:00:00'));
    const range = visibleHourRange([
      { start: at(day, 0, 12), end: at(day, 0, 42) },
      { start: at(day, 0, 21), end: at(day, 0, 51) },
    ]);
    assert.equal(range.startHour, 0);
    assert.equal(range.endHour, 20);
  });
});
