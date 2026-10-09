import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizeLocalPhone,
  validateEmail,
  validatePassword,
  validatePhone,
} from './validation.ts';

const valid72 = `Aa1!${'a'.repeat(68)}`;

describe('validatePassword boundaries', () => {
  it('rejects empty, short, long, and incomplete passwords', () => {
    assert.equal(validatePassword('') !== null, true);
    assert.equal(validatePassword('Aa1!aaa') !== null, true);
    assert.equal(validatePassword(`${valid72}a`) !== null, true);
    assert.equal(validatePassword('aa1!aaaa') !== null, true);
    assert.equal(validatePassword('AA1!AAAA') !== null, true);
    assert.equal(validatePassword('Aa!aaaaa') !== null, true);
    assert.equal(validatePassword('Aa1aaaaa') !== null, true);
  });

  it('accepts the 8-character and 72-character valid passwords', () => {
    assert.equal(validatePassword('Aa1!aaaa'), null);
    assert.equal(valid72.length, 72);
    assert.equal(validatePassword(valid72), null);
  });
});

describe('validateEmail boundaries', () => {
  it('rejects empty and a domain without a dot', () => {
    assert.equal(validateEmail('') !== null, true);
    assert.equal(validateEmail('a@b') !== null, true);
  });

  it('accepts a minimal dotted address and trims surrounding spaces', () => {
    assert.equal(validateEmail('a@b.c'), null);
    assert.equal(validateEmail('  a@b.c  '), null);
  });
});

describe('validatePhone boundaries', () => {
  it('rejects empty when required and a 9-digit number', () => {
    assert.equal(validatePhone('', true) !== null, true);
    assert.equal(validatePhone('123456789', true) !== null, true);
  });

  it('accepts 10 digits and a +91 prefix normalized to those digits', () => {
    assert.equal(validatePhone('9876543210', true), null);
    assert.equal(normalizeLocalPhone('+919876543210'), '9876543210');
    assert.equal(validatePhone('+919876543210', true), null);
  });
});
