import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatBytes, usagePercent } from './formatBytes.ts';

describe('formatBytes', () => {
  it('formats bytes through gigabytes', () => {
    assert.equal(formatBytes(512), '512 B');
    assert.equal(formatBytes(2048), '2.0 KB');
    assert.equal(formatBytes(10 * 1024 * 1024), '10 MB');
    assert.equal(formatBytes(2 * 1024 * 1024 * 1024 * 1024), '2.0 TB');
  });
});

describe('usagePercent', () => {
  it('clamps and guards zero max', () => {
    assert.equal(usagePercent(50, 100), 50);
    assert.equal(usagePercent(0, 0), 0);
    assert.equal(usagePercent(150, 100), 100);
  });
});
