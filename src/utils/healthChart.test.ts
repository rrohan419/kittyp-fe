import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  appendSample,
  donutArcs,
  formatHealthDetail,
  linePath,
  numDetail,
  stackedPercents,
} from './healthChart.ts';

describe('donutArcs', () => {
  it('splits a full ring by value', () => {
    const arcs = donutArcs([
      { label: 'Used', value: 75, display: '75', color: '#000' },
      { label: 'Free', value: 25, display: '25', color: '#fff' },
    ]);
    assert.equal(arcs.length, 2);
    assert.ok(arcs[0].dash > arcs[1].dash);
    assert.equal(arcs[0].rotate, -90);
  });
});

describe('stackedPercents', () => {
  it('normalizes to 100', () => {
    assert.deepEqual(stackedPercents([2, 2, 6]), [20, 20, 60]);
  });
});

describe('appendSample', () => {
  it('keeps the last max samples', () => {
    const next = appendSample(
      [{ mem: 1, disk: 1, pool: 1 }, { mem: 2, disk: 2, pool: 2 }],
      { mem: 3, disk: 3, pool: 3 },
      2,
    );
    assert.equal(next.length, 2);
    assert.equal(next[1].mem, 3);
  });
});

describe('linePath', () => {
  it('builds an svg path', () => {
    const d = linePath([0, 50, 100], 100, 100, 10);
    assert.match(d, /^M/);
    assert.match(d, / L/);
  });
});

describe('numDetail', () => {
  it('reads numbers and defaults missing keys', () => {
    assert.equal(numDetail({ used: 12 }, 'used'), 12);
    assert.equal(numDetail({}, 'used'), 0);
  });
});

describe('formatHealthDetail', () => {
  it('formats byte keys through the bytes helper', () => {
    assert.equal(formatHealthDetail('used', 2048, () => '2 KB'), '2 KB');
    assert.equal(formatHealthDetail('active', 3, () => 'nope'), '3');
    assert.equal(formatHealthDetail('exists', true, () => ''), 'yes');
  });
});
