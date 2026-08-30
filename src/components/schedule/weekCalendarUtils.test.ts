import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { setHours, setMinutes, setSeconds, startOfDay } from 'date-fns';
import {
  HOUR_PX,
  eventLayout,
  nowLineOffsetPx,
  slotStartFromHourClick,
  visibleHourRange,
  withLanes,
} from './weekCalendarLayout.ts';

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

  it('expands the grid to include the current hour', () => {
    const day = startOfDay(new Date('2026-08-19T00:00:00'));
    const range = visibleHourRange([], at(day, 7, 15));
    assert.equal(range.startHour, 7);
    assert.equal(range.endHour, 20);
  });
});

describe('nowLineOffsetPx', () => {
  it('places 9:30 at 1.5 hours from an 8am range start', () => {
    const day = startOfDay(new Date('2026-08-19T00:00:00'));
    assert.equal(nowLineOffsetPx(at(day, 9, 30), { startHour: 8, endHour: 20 }), 1.5 * HOUR_PX);
  });

  it('returns null when now is outside the visible range', () => {
    const day = startOfDay(new Date('2026-08-19T00:00:00'));
    assert.equal(nowLineOffsetPx(at(day, 6, 0), { startHour: 8, endHour: 20 }), null);
  });
});

describe('slotStartFromHourClick', () => {
  it('snaps the top half of an hour cell to :00 and the bottom to :30', () => {
    const day = startOfDay(new Date('2026-08-19T00:00:00'));
    const top = slotStartFromHourClick(day, 10, 10);
    const bottom = slotStartFromHourClick(day, 10, HOUR_PX / 2);
    assert.equal(top.getHours(), 10);
    assert.equal(top.getMinutes(), 0);
    assert.equal(bottom.getHours(), 10);
    assert.equal(bottom.getMinutes(), 30);
  });
});
