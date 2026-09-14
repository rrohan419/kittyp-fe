import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isEmbeddedSignupFinish,
  isFacebookMessageOrigin,
  parseEmbeddedSignupMessage,
  pickEmbeddedSignupId,
} from './whatsappEmbeddedSignup.ts';

describe('whatsappEmbeddedSignup', () => {
  it('accepts facebook.com message origins Meta documents', () => {
    assert.equal(isFacebookMessageOrigin('https://www.facebook.com'), true);
    assert.equal(isFacebookMessageOrigin('https://web.facebook.com'), true);
    assert.equal(isFacebookMessageOrigin('https://facebook.com'), true);
    assert.equal(isFacebookMessageOrigin('https://evil.example'), false);
  });

  it('treats every FINISH* event as successful onboarding', () => {
    assert.equal(isEmbeddedSignupFinish('FINISH'), true);
    assert.equal(isEmbeddedSignupFinish('FINISH_ONLY_WABA'), true);
    assert.equal(isEmbeddedSignupFinish('FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'), true);
    assert.equal(isEmbeddedSignupFinish('CANCEL'), false);
    assert.equal(isEmbeddedSignupFinish('ERROR'), false);
  });

  it('reads waba and phone IDs from nested session payloads', () => {
    const payload = parseEmbeddedSignupMessage({
      type: 'WA_EMBEDDED_SIGNUP',
      event: 'FINISH',
      data: { waba_id: 'waba-1', phone_number_id: 'phone-1' },
    });
    assert.ok(payload);
    assert.equal(pickEmbeddedSignupId(payload, 'waba_id'), 'waba-1');
    assert.equal(pickEmbeddedSignupId(payload, 'phone_number_id'), 'phone-1');
  });
});
