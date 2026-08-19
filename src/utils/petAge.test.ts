import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatPetAgeCompact, formatPetDobWithAge } from './petAge.ts';

const now = new Date(2026, 7, 19); // 19 Aug 2026

describe('formatPetAgeCompact', () => {
  it('formats years and months as 2y3m', () => {
    assert.equal(formatPetAgeCompact('2024-05-12', now), '2y3m');
  });

  it('omits zero months', () => {
    assert.equal(formatPetAgeCompact('2024-08-19', now), '2y');
  });

  it('formats months only when under one year', () => {
    assert.equal(formatPetAgeCompact('2026-05-19', now), '3m');
  });

  it('uses <1m under one month', () => {
    assert.equal(formatPetAgeCompact('2026-08-10', now), '<1m');
  });
});

describe('formatPetDobWithAge', () => {
  it('puts compact age in brackets after the date of birth', () => {
    assert.equal(formatPetDobWithAge('2024-05-12', now), '12 May 2024 (2y3m)');
  });
});
