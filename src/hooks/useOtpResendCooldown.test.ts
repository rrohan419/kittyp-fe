import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { otpSendButtonLabel } from './useOtpResendCooldown.ts';

describe('otpSendButtonLabel', () => {
  it('shows Sending while request in flight', () => {
    assert.equal(otpSendButtonLabel(true, 30, 'Resend OTP'), 'Sending…');
  });

  it('shows remaining seconds while cooling down', () => {
    assert.equal(otpSendButtonLabel(false, 30, 'Resend OTP'), 'Resend in 30s');
    assert.equal(otpSendButtonLabel(false, 1, 'Resend OTP'), 'Resend in 1s');
  });

  it('shows idle label when ready', () => {
    assert.equal(otpSendButtonLabel(false, 0, 'Resend OTP'), 'Resend OTP');
    assert.equal(otpSendButtonLabel(false, 0, 'Send OTP'), 'Send OTP');
  });
});
