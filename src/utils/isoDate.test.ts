import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatIsoDate, parseIsoDate, toDateBound } from './isoDate.ts';

describe('parseIsoDate', () => {
  it('parses yyyy-MM-dd as a local date', () => {
    const d = parseIsoDate('2026-08-26');
    assert.ok(d);
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 7);
    assert.equal(d.getDate(), 26);
  });

  it('returns undefined for empty or invalid values', () => {
    assert.equal(parseIsoDate(''), undefined);
    assert.equal(parseIsoDate('26-08-2026'), undefined);
    assert.equal(parseIsoDate(null), undefined);
  });
});

describe('formatIsoDate', () => {
  it('formats a local date as yyyy-MM-dd', () => {
    assert.equal(formatIsoDate(new Date(2026, 7, 26)), '2026-08-26');
  });
});

describe('toDateBound', () => {
  it('normalizes Date and string bounds to start of day', () => {
    const fromDate = toDateBound(new Date(2026, 7, 26, 15, 30));
    const fromString = toDateBound('2026-08-26');
    assert.ok(fromDate);
    assert.ok(fromString);
    assert.equal(fromDate.getTime(), fromString.getTime());
  });
});
