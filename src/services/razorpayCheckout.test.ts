import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  RazorpayCheckoutError,
  isRazorpayCheckoutError,
  openRazorpayCheckout,
  type RazorpayError,
  type RazorpayInstance,
  type RazorpayOptions,
  type RazorpayOrderResponse,
} from './razorpayCheckout.ts';

type FailHandler = (error: RazorpayError) => void;

class FakeRazorpay implements RazorpayInstance {
  options: RazorpayOptions;
  failHandler?: FailHandler;

  constructor(options: RazorpayOptions) {
    this.options = options;
    FakeRazorpay.last = this;
  }

  static last: FakeRazorpay | undefined;

  open() {}
  close() {}
  on(event: 'payment.failed' | 'modal.closed', handler: FailHandler | (() => void)) {
    if (event === 'payment.failed') {
      this.failHandler = handler as FailHandler;
    }
  }
}

describe('openRazorpayCheckout', () => {
  beforeEach(() => {
    FakeRazorpay.last = undefined;
    const style: Record<string, string> = {};
    (globalThis as { document?: unknown }).document = {
      querySelector: () => ({ src: 'https://checkout.razorpay.com/v1/checkout.js' }),
      createElement: () => ({ src: '', onload: undefined, onerror: undefined }),
      body: { style, appendChild() {} },
    };
    (globalThis as { window?: unknown }).window = {
      scrollY: 0,
      scrollTo() {},
      Razorpay: FakeRazorpay,
    };
    Object.assign(globalThis, {
      document: (globalThis as { document: unknown }).document,
      window: (globalThis as { window: unknown }).window,
    });
  });

  afterEach(() => {
    delete (globalThis as { document?: unknown }).document;
    delete (globalThis as { window?: unknown }).window;
  });

  const args = {
    amount: 50000,
    currency: 'INR',
    name: 'Kittyp',
    description: 'Test',
    order_id: 'order_1',
    key: 'rzp_test_key',
  };

  it('resolves on handler success and ignores later dismiss', async () => {
    const pending = openRazorpayCheckout(args);
    await Promise.resolve();
    const payload: RazorpayOrderResponse = {
      razorpay_payment_id: 'pay_1',
      razorpay_order_id: 'order_1',
      razorpay_signature: 'sig',
    };
    FakeRazorpay.last?.options.handler(payload);
    FakeRazorpay.last?.options.modal?.ondismiss?.();
    const result = await pending;
    assert.equal(result.razorpay_payment_id, 'pay_1');
  });

  it('rejects dismissed', async () => {
    const pending = openRazorpayCheckout(args);
    await Promise.resolve();
    FakeRazorpay.last?.options.modal?.ondismiss?.();
    await assert.rejects(pending, (error: unknown) => {
      assert.equal(isRazorpayCheckoutError(error), true);
      assert.equal((error as RazorpayCheckoutError).kind, 'dismissed');
      return true;
    });
  });

  it('rejects payment.failed with Razorpay description', async () => {
    const pending = openRazorpayCheckout(args);
    await Promise.resolve();
    const fail: RazorpayError = {
      error: {
        code: 'BAD_REQUEST_ERROR',
        description: 'Payment was declined',
        source: 'bank',
        step: 'payment_authentication',
        reason: 'declined',
      },
    };
    FakeRazorpay.last?.failHandler?.(fail);
    await assert.rejects(pending, (error: unknown) => {
      assert.equal(isRazorpayCheckoutError(error), true);
      assert.equal((error as RazorpayCheckoutError).kind, 'failed');
      assert.equal((error as RazorpayCheckoutError).message, 'Payment was declined');
      return true;
    });
  });
});
