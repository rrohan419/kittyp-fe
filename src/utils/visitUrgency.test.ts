import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calendarBlockClass,
  dashboardVisitSurfaceClass,
  isUrgentVisit,
  routineCalendarBlockClass,
  routineVisitBadgeClass,
  routineVisitSurfaceClass,
  urgentCalendarBlockClass,
  urgentVisitBadgeClass,
  urgentVisitSurfaceClass,
} from './visitUrgency.ts';

describe('isUrgentVisit', () => {
  it('is true only for URGENT', () => {
    assert.equal(isUrgentVisit('URGENT'), true);
    assert.equal(isUrgentVisit('ROUTINE'), false);
    assert.equal(isUrgentVisit(undefined), false);
    assert.equal(isUrgentVisit(null), false);
    assert.equal(isUrgentVisit(''), false);
  });
});

describe('calendar colors', () => {
  it('routine is sky, urgent is rose', () => {
    assert.match(routineCalendarBlockClass, /bg-sky-600/);
    assert.match(urgentCalendarBlockClass, /bg-rose-600/);
    assert.notEqual(calendarBlockClass(false), calendarBlockClass(true));
  });

  it('list urgent uses rose stripe, not orange or destructive', () => {
    assert.match(urgentVisitSurfaceClass, /bg-rose-50/);
    assert.match(urgentVisitSurfaceClass, /border-l-rose-600/);
    assert.doesNotMatch(urgentVisitSurfaceClass, /orange|destructive/);
  });

  it('list routine uses sky stripe, distinct from urgent', () => {
    assert.match(routineVisitSurfaceClass, /border-l-sky-500/);
    assert.notEqual(dashboardVisitSurfaceClass(true), dashboardVisitSurfaceClass(false));
    assert.match(routineVisitBadgeClass, /bg-sky-100/);
  });

  it('badge matches rose hue', () => {
    assert.match(urgentVisitBadgeClass, /bg-rose-100/);
    assert.match(urgentVisitBadgeClass, /text-rose-800/);
  });
});
