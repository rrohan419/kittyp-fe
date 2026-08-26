import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { consultPath, isVideoConsult } from './consult.ts';

describe('isVideoConsult', () => {
  it('matches VIDEO mode only', () => {
    assert.equal(isVideoConsult('VIDEO'), true);
    assert.equal(isVideoConsult('video'), true);
    assert.equal(isVideoConsult('IN_PERSON'), false);
    assert.equal(isVideoConsult(undefined), false);
  });
});

describe('consultPath', () => {
  it('uses the portal prefix', () => {
    assert.equal(consultPath('abc', 'parent'), '/app/consult/abc');
    assert.equal(consultPath('abc', 'doctor'), '/doctor/consult/abc');
  });
});
