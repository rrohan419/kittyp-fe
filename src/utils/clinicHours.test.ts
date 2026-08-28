import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  defaultClinicHours,
  formatClinicHours,
  formatTime12h,
  parseOperatingHours,
  serializeOperatingHours,
} from './clinicHours.ts';

describe('clinic operating hours', () => {
  it('empty string is unset, not fake defaults', () => {
    const parsed = parseOperatingHours('');
    assert.equal(parsed.legacyText, null);
    assert.equal(parsed.days.length, 0);
  });

  it('parses JSON array into a full week', () => {
    const raw = JSON.stringify([
      { dayOfWeek: 1, closed: false, startTime: '08:00', endTime: '16:00' },
    ]);
    const parsed = parseOperatingHours(raw);
    assert.equal(parsed.legacyText, null);
    const monday = parsed.days.find((d) => d.dayOfWeek === 1);
    assert.equal(monday?.startTime, '08:00');
    assert.equal(monday?.endTime, '16:00');
    assert.equal(parsed.days.length, 7);
  });

  it('keeps free-text as legacy until first save', () => {
    const parsed = parseOperatingHours('Mon-Fri 9-5');
    assert.equal(parsed.legacyText, 'Mon-Fri 9-5');
    assert.equal(parsed.days.length, 0);
  });

  it('round-trips serialize then parse', () => {
    const days = defaultClinicHours();
    days[1] = { dayOfWeek: 1, closed: false, startTime: '10:00', endTime: '19:00' };
    const parsed = parseOperatingHours(serializeOperatingHours(days));
    assert.equal(parsed.legacyText, null);
    assert.equal(parsed.days[1].startTime, '10:00');
    assert.match(formatClinicHours(parsed.days), /Monday: 10:00 AM – 7:00 PM/);
  });

  it('formats 24h times as 12h', () => {
    assert.equal(formatTime12h('09:00'), '9:00 AM');
    assert.equal(formatTime12h('18:00'), '6:00 PM');
    assert.equal(formatTime12h('00:30'), '12:30 AM');
  });
});
