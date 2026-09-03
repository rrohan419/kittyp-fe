import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasAuthToken } from './authStorage.ts';

describe('hasAuthToken', () => {
  const original = globalThis.localStorage;

  it('false when no access_token', () => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
      },
      configurable: true,
    });
    assert.equal(hasAuthToken(), false);
    store.set('access_token', 'jwt');
    assert.equal(hasAuthToken(), true);
    Object.defineProperty(globalThis, 'localStorage', { value: original, configurable: true });
  });
});
