import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatPetType, petNameWithType } from './petType.ts';

describe('formatPetType', () => {
  it('maps CAT/cat to Cat and DOG/dog to Dog', () => {
    assert.equal(formatPetType('CAT'), 'Cat');
    assert.equal(formatPetType('cat'), 'Cat');
    assert.equal(formatPetType('DOG'), 'Dog');
    assert.equal(formatPetType('dog'), 'Dog');
  });

  it('keeps Canine and Feline (case-insensitive)', () => {
    assert.equal(formatPetType('Canine'), 'Canine');
    assert.equal(formatPetType('canine'), 'Canine');
    assert.equal(formatPetType('Feline'), 'Feline');
    assert.equal(formatPetType('feline'), 'Feline');
  });

  it('returns blank for empty values', () => {
    assert.equal(formatPetType(''), '');
    assert.equal(formatPetType('   '), '');
    assert.equal(formatPetType(null), '');
    assert.equal(formatPetType(undefined), '');
  });

  it('keeps unknown stored text', () => {
    assert.equal(formatPetType('Parrot'), 'Parrot');
  });
});

describe('petNameWithType', () => {
  it('joins name and type', () => {
    assert.equal(petNameWithType('Bruno', 'DOG'), 'Bruno · Dog');
    assert.equal(petNameWithType('Luna', 'Feline'), 'Luna · Feline');
  });

  it('returns name only when type is blank', () => {
    assert.equal(petNameWithType('Bruno', ''), 'Bruno');
    assert.equal(petNameWithType('Bruno', null), 'Bruno');
  });
});
