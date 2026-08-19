import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  doctorCalendarBlockClass,
  doctorCalendarColorIndex,
  doctorCalendarSwatchClass,
  doctorDisplayName,
} from './doctorCalendarColor.ts';

const UUID_A = '11111111-1111-1111-1111-111111111111';
const UUID_B = '22222222-2222-2222-2222-222222222222';

describe('doctorCalendarColor', () => {
  it('same uuid always maps to the same class', () => {
    assert.equal(doctorCalendarBlockClass(UUID_A), doctorCalendarBlockClass(UUID_A));
    assert.equal(doctorCalendarColorIndex(UUID_A), doctorCalendarColorIndex(UUID_A));
  });

  it('null, undefined, and empty uuid use unassigned slate', () => {
    const unassigned = doctorCalendarBlockClass(null);
    assert.equal(doctorCalendarBlockClass(undefined), unassigned);
    assert.equal(doctorCalendarBlockClass(''), unassigned);
    assert.match(unassigned, /bg-slate-100/);
    assert.match(doctorCalendarSwatchClass(null), /bg-slate-100/);
  });

  it('assigned palette uses light fills, not saturated *-600', () => {
    const block = doctorCalendarBlockClass(UUID_A);
    assert.match(block, /bg-\w+-100/);
    assert.doesNotMatch(block, /bg-\w+-600/);
    assert.doesNotMatch(block, /sky|rose/);
    const swatch = doctorCalendarSwatchClass(UUID_A);
    assert.match(swatch, /bg-\w+-100/);
    assert.doesNotMatch(swatch, /bg-\w+-600/);
  });

  it('two different uuids can map to different indexes', () => {
    const samples = [
      UUID_A,
      UUID_B,
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
    ];
    const indexes = new Set(samples.map((id) => doctorCalendarColorIndex(id)));
    assert.ok(indexes.size > 1);
  });
});

describe('doctorDisplayName', () => {
  it('prefers doctors list, then visit/booking name, strips Dr prefix', () => {
    assert.equal(
      doctorDisplayName(
        { doctorUuid: UUID_A, visit: { doctorName: 'Visit Name' } },
        [{ doctorUuid: UUID_A, name: 'Dr. List' }]
      ),
      'List'
    );
    assert.equal(
      doctorDisplayName({ doctorUuid: UUID_A, visit: { doctorName: 'Dr. Visit' } }),
      'Visit'
    );
    assert.equal(
      doctorDisplayName({ doctorUuid: UUID_A, booking: { doctorName: 'Booked' } }),
      'Booked'
    );
    assert.equal(doctorDisplayName({ doctorUuid: UUID_A }), null);
  });
});
