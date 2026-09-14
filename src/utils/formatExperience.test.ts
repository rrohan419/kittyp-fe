import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatExperienceYears } from './formatExperience.ts';

describe('formatExperienceYears', () => {
  it('omits empty and invalid values', () => {
    assert.equal(formatExperienceYears(null), null);
    assert.equal(formatExperienceYears(undefined), null);
    assert.equal(formatExperienceYears(''), null);
    assert.equal(formatExperienceYears('abc'), null);
    assert.equal(formatExperienceYears(Number.NaN), null);
    assert.equal(formatExperienceYears(-1), null);
  });

  it('formats Experience - 1 yr vs Experience - N yrs', () => {
    assert.equal(formatExperienceYears(1), 'Experience - 1 yr');
    assert.equal(formatExperienceYears(5), 'Experience - 5 yrs');
    assert.equal(formatExperienceYears('8'), 'Experience - 8 yrs');
    assert.equal(formatExperienceYears(0), 'Experience - 0 yrs');
  });
});
