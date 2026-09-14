import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { doctorSlotBusyHint, formatHoursLabel, slotMinuteKey, slotStartParts } from './clinicSlots.ts';

describe('formatHoursLabel', () => {
  it('turns 24h windows into 12h', () => {
    assert.equal(formatHoursLabel('09:00–17:00'), '9:00 AM–5:00 PM');
    assert.equal(formatHoursLabel('09:00-12:00, 14:00-17:00'), '9:00 AM–12:00 PM, 2:00 PM–5:00 PM');
  });
});

describe('slotMinuteKey / slotStartParts', () => {
  it('keeps wall-clock minute precision', () => {
    assert.equal(slotMinuteKey('2026-09-21T16:30:00'), '2026-09-21T16:30');
    assert.deepEqual(slotStartParts('2026-09-21T16:30'), { date: '2026-09-21', time: '16:30' });
  });
});

describe('doctorSlotBusyHint', () => {
  const selected = {
    selectedKey: '2026-09-21T17:30',
    selectedLabel: '5:30 PM',
  };

  it('says not working when closed', () => {
    assert.equal(
      doctorSlotBusyHint({ closed: true, slots: [], ...selected }),
      'Doctor is not working this day'
    );
  });

  it('says no remaining slots when hours exist but list is empty', () => {
    assert.equal(
      doctorSlotBusyHint({ closed: false, slots: [], ...selected }),
      'No remaining slots this day'
    );
  });

  it('names hours when the selected time is outside the list', () => {
    assert.equal(
      doctorSlotBusyHint({
        closed: false,
        slots: ['2026-09-21T16:30'],
        hoursLabel: '09:00–17:00',
        ...selected,
      }),
      'Doctor not available at 5:30 PM — hours today 9:00 AM–5:00 PM'
    );
  });

  it('clears when the selected time is free', () => {
    assert.equal(
      doctorSlotBusyHint({
        closed: false,
        slots: ['2026-09-21T16:30'],
        selectedKey: '2026-09-21T16:30',
        selectedLabel: '4:30 PM',
      }),
      null
    );
  });

  it('clears when keeping the booking own slot', () => {
    assert.equal(
      doctorSlotBusyHint({ closed: true, slots: [], keepingOwn: true, ...selected }),
      null
    );
  });
});
