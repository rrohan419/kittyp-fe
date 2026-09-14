import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  EMAIL_ALREADY_REGISTERED,
  isEmailAlreadyRegistered,
  isOtpFailed,
  normalizeLoginIdentifier,
  validateClinicName,
  validateEmail,
  validateLoginIdentifier,
  validatePersonName,
} from './validation.ts';

describe('validateLoginIdentifier', () => {
  it('accepts email', () => {
    assert.equal(validateLoginIdentifier('doc@example.com'), null);
  });

  it('accepts 6-character public id', () => {
    assert.equal(validateLoginIdentifier('AB12CD'), null);
    assert.equal(validateLoginIdentifier('doc9k2'), null);
  });

  it('accepts legacy UUID', () => {
    assert.equal(validateLoginIdentifier('550e8400-e29b-41d4-a716-446655440000'), null);
  });

  it('rejects empty and junk', () => {
    assert.equal(validateLoginIdentifier(''), 'Email or ID is required');
    assert.equal(validateLoginIdentifier('not-an-id'), 'Enter your email or account, doctor, or clinic ID');
  });
});

describe('validateEmail', () => {
  it('accepts a normal address', () => {
    assert.equal(validateEmail('name@example.com'), null);
  });

  it('rejects short TLD and spaces', () => {
    assert.equal(validateEmail('a@b.c'), 'Enter a valid email address');
    assert.equal(validateEmail('not an email'), 'Enter a valid email address');
  });
});

describe('validatePersonName', () => {
  it('accepts letters hyphen and apostrophe', () => {
    assert.equal(validatePersonName("Mary-Jane", 'First name'), null);
    assert.equal(validatePersonName("O'Brien", 'Last name'), null);
  });

  it('rejects digits and specials', () => {
    assert.equal(
      validatePersonName('John@#', 'First name'),
      'First name can only contain letters, spaces, hyphens, and apostrophes'
    );
  });
});

describe('validateClinicName', () => {
  it('allows digits and ampersand', () => {
    assert.equal(validateClinicName('Happy Paws & Co 2'), null);
  });
});

describe('signup error helpers', () => {
  it('detects duplicate email and otp failures', () => {
    assert.equal(isEmailAlreadyRegistered(EMAIL_ALREADY_REGISTERED), true);
    assert.equal(isEmailAlreadyRegistered("User already exists with email : 'a@b.com'"), true);
    assert.equal(isOtpFailed('Invalid or expired OTP'), true);
  });
});

describe('normalizeLoginIdentifier', () => {
  it('lowercases email and uppercases public id', () => {
    assert.equal(normalizeLoginIdentifier('Doc@Example.COM'), 'doc@example.com');
    assert.equal(normalizeLoginIdentifier('doc9k2'), 'DOC9K2');
  });
});
