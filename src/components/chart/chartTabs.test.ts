import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import {
  isChartTabId,
  parsePatientDashboardTab,
  PATIENT_DASHBOARD_TABS,
} from './chartTabs.ts';

const dir = dirname(fileURLToPath(import.meta.url));

describe('chart tab ids', () => {
  it('accepts only vitals, notes, prescriptions', () => {
    assert.equal(isChartTabId('vitals'), true);
    assert.equal(isChartTabId('notes'), true);
    assert.equal(isChartTabId('prescriptions'), true);
    assert.equal(isChartTabId('timeline'), false);
    assert.equal(isChartTabId(null), false);
  });

  it('parses dashboard ?tab= with timeline default', () => {
    assert.equal(parsePatientDashboardTab(null), 'timeline');
    assert.equal(parsePatientDashboardTab('prescriptions'), 'prescriptions');
    assert.equal(parsePatientDashboardTab('vitals'), 'timeline');
    assert.equal(parsePatientDashboardTab('notes'), 'timeline');
    assert.equal(parsePatientDashboardTab('unknown'), 'timeline');
    assert.ok(PATIENT_DASHBOARD_TABS.includes('prescriptions'));
  });
});

describe('prescription mount contract', () => {
  it('VitalsTab and NotesTab do not import PrescriptionsTab', () => {
    const vitals = readFileSync(join(dir, 'VitalsTab.tsx'), 'utf8');
    const notes = readFileSync(join(dir, 'NotesTab.tsx'), 'utf8');
    assert.equal(vitals.includes('PrescriptionsTab'), false);
    assert.equal(notes.includes('PrescriptionsTab'), false);
    assert.equal(vitals.includes('Add Prescription'), false);
    assert.equal(notes.includes('Add Prescription'), false);
  });

  it('VisitChartTabs mounts PrescriptionsTab only when tab is prescriptions', () => {
    const source = readFileSync(join(dir, 'VisitChartTabs.tsx'), 'utf8');
    assert.match(source, /tab === 'prescriptions'/);
    assert.match(source, /<PrescriptionsTab/);
    const prescriptionsBlock = source.slice(source.indexOf("tab === 'prescriptions'"));
    assert.match(prescriptionsBlock, /<PrescriptionsTab/);
    const vitalsBlock = source.slice(
      source.indexOf("tab === 'vitals'"),
      source.indexOf("tab === 'notes'")
    );
    assert.equal(vitalsBlock.includes('<PrescriptionsTab'), false);
  });
});
