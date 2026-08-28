import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeLoginIdentifier, validateLoginIdentifier } from './validation.ts';

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

describe('normalizeLoginIdentifier', () => {
  it('lowercases email and uppercases public id', () => {
    assert.equal(normalizeLoginIdentifier('Doc@Example.COM'), 'doc@example.com');
    assert.equal(normalizeLoginIdentifier('doc9k2'), 'DOC9K2');
  });
});
