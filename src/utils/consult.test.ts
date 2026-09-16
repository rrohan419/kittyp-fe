import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { consultPath, doctorCanJoinVideo, incomingCallerLabel, incomingCallerPhotoUrl, isVideoCallPush, isVideoConsult, parentCanJoinVideo, shouldShowIncomingVideoCall } from './consult.ts';

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

describe('shouldShowIncomingVideoCall', () => {
  it('hides when already on that consult path', () => {
    assert.equal(shouldShowIncomingVideoCall('/doctor/consult/abc', '/doctor/consult/abc'), false);
    assert.equal(shouldShowIncomingVideoCall('/app/appointments', '/app/consult/abc'), true);
    assert.equal(shouldShowIncomingVideoCall('/app/consult/abc', undefined), false);
  });
});

describe('isVideoCallPush', () => {
  it('matches VIDEO_CALL type or consult url', () => {
    assert.equal(isVideoCallPush({ type: 'VIDEO_CALL' }), true);
    assert.equal(isVideoCallPush({ url: '/doctor/consult/abc' }), true);
    assert.equal(isVideoCallPush({ url: '/offers' }), false);
    assert.equal(isVideoCallPush(null), false);
  });
});

describe('parentCanJoinVideo', () => {
  it('requires VIDEO mode, a live doctor session, and an open window', () => {
    assert.equal(parentCanJoinVideo('VIDEO', true), true);
    assert.equal(parentCanJoinVideo('VIDEO', true, true), true);
    assert.equal(parentCanJoinVideo('VIDEO', true, false), false);
    assert.equal(parentCanJoinVideo('VIDEO', false), false);
    assert.equal(parentCanJoinVideo('VIDEO', undefined), false);
    assert.equal(parentCanJoinVideo('IN_PERSON', true), false);
  });
});

describe('doctorCanJoinVideo', () => {
  it('requires VIDEO mode and an open window', () => {
    assert.equal(doctorCanJoinVideo('VIDEO'), true);
    assert.equal(doctorCanJoinVideo('VIDEO', true), true);
    assert.equal(doctorCanJoinVideo('VIDEO', false), false);
    assert.equal(doctorCanJoinVideo('IN_PERSON', true), false);
  });
});

describe('incomingCallerLabel', () => {
  it('prefixes Dr unless already present', () => {
    assert.equal(incomingCallerLabel('Asha Doctor'), 'Dr. Asha Doctor');
    assert.equal(incomingCallerLabel('Dr. Asha'), 'Dr. Asha');
    assert.equal(incomingCallerLabel(''), 'Dr. Someone');
    assert.equal(incomingCallerLabel(undefined), 'Dr. Someone');
  });
});

describe('incomingCallerPhotoUrl', () => {
  it('returns a photo url or null for the silhouette fallback', () => {
    assert.equal(incomingCallerPhotoUrl('https://cdn.kittyp.test/asha.jpg'), 'https://cdn.kittyp.test/asha.jpg');
    assert.equal(incomingCallerPhotoUrl('  '), null);
    assert.equal(incomingCallerPhotoUrl(undefined), null);
  });
});
