import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isInvoiceUnpaid, prefillFromInvoice, recordedPaymentMode } from './invoicePaymentState.ts';
import type { ConsultationInvoice } from '../services/invoiceService.ts';

const base = (): ConsultationInvoice => ({
  uuid: 'inv-1',
  amount: 500,
  status: 'ISSUED',
  paymentStatus: 'UNPAID',
  balance: 500,
});

describe('invoice payment state', () => {
  it('unpaid when balance remains', () => {
    assert.equal(isInvoiceUnpaid(base()), true);
  });

  it('paid when status or paymentStatus is PAID', () => {
    assert.equal(isInvoiceUnpaid({ ...base(), status: 'PAID', balance: 0 }), false);
    assert.equal(isInvoiceUnpaid({ ...base(), paymentStatus: 'PAID', balance: 0 }), false);
  });

  it('maps create-form Cash to CASH allowlist', () => {
    assert.equal(recordedPaymentMode('Cash'), 'CASH');
    assert.equal(recordedPaymentMode('upi'), 'UPI');
    assert.equal(recordedPaymentMode('RAZORPAY'), 'UPI');
    assert.equal(recordedPaymentMode(undefined), 'UPI');
  });

  it('reads owner prefill from snapshot JSON', () => {
    const prefill = prefillFromInvoice({
      ...base(),
      ownerSnapshot: JSON.stringify({
        ownerName: 'Ada',
        ownerEmail: 'ada@example.com',
        ownerPhone: '9876543210',
      }),
    });
    assert.equal(prefill.name, 'Ada');
    assert.equal(prefill.email, 'ada@example.com');
    assert.equal(prefill.contact, '9876543210');
  });
});
