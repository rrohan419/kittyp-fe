import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isMasterTotpSetupDone, markMasterTotpSetupDone, MASTER_TOTP_DONE_KEY, setupKeyFromOtpauth } from './otpauth.ts';

describe('setupKeyFromOtpauth', () => {
  it('reads secret from otpauth URI', () => {
    const uri =
      'otpauth://totp/Kittyp:master?secret=JBSWY3DPEHPK3PXP&issuer=Kittyp&period=30&digits=6';
    assert.equal(setupKeyFromOtpauth(uri), 'JBSWY3DPEHPK3PXP');
  });

  it('returns null when missing', () => {
    assert.equal(setupKeyFromOtpauth(null), null);
    assert.equal(setupKeyFromOtpauth(''), null);
    assert.equal(setupKeyFromOtpauth('otpauth://totp/Kittyp:master?issuer=Kittyp'), null);
  });
});

describe('master TOTP setup done flag', () => {
  it('treats matching setup key as done', () => {
    const mem = new Map<string, string>();
    const storage = {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    };
    assert.equal(isMasterTotpSetupDone('JBSWY3DPEHPK3PXP', storage), false);
    markMasterTotpSetupDone('JBSWY3DPEHPK3PXP', storage);
    assert.equal(mem.get(MASTER_TOTP_DONE_KEY), 'JBSWY3DPEHPK3PXP');
    assert.equal(isMasterTotpSetupDone('JBSWY3DPEHPK3PXP', storage), true);
    assert.equal(isMasterTotpSetupDone('OTHERSECRET', storage), false);
  });
});
