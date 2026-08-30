import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { filterOpenSlots, slotHasNotStarted } from './clinicSlots.ts';

describe('filterOpenSlots', () => {
  // 2026-08-29 14:40 in Asia/Kolkata
  const now = new Date('2026-08-29T09:10:00.000Z');

  it('hides this morning when it is already afternoon in the clinic', () => {
    assert.equal(slotHasNotStarted('2026-08-29T09:30', 'Asia/Kolkata', now), false);
    assert.equal(slotHasNotStarted('2026-08-29T14:30', 'Asia/Kolkata', now), false);
    assert.equal(slotHasNotStarted('2026-08-29T15:00', 'Asia/Kolkata', now), true);
  });

  it('keeps tomorrow morning', () => {
    assert.equal(slotHasNotStarted('2026-08-30T09:30', 'Asia/Kolkata', now), true);
  });

  it('drops past starts from a full-day list', () => {
    const open = filterOpenSlots(
      ['2026-08-29T09:30', '2026-08-29T14:30', '2026-08-29T15:00', '2026-08-29T17:00'],
      'Asia/Kolkata',
      now
    );
    assert.deepEqual(open, ['2026-08-29T15:00', '2026-08-29T17:00']);
  });
});
