export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayOrderResponse) => void;
  prefill: RazorpayPrefill;
  theme: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
  };
}

export type RazorpayOrderResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayError = {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
  };
};

interface RazorpayEvents {
  "payment.failed": (error: RazorpayError) => void;
  "modal.closed": () => void;
}

export interface RazorpayInstance {
  open: () => void;
  on<K extends keyof RazorpayEvents>(event: K, handler: RazorpayEvents[K]): void;
  close: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export type RazorpayCheckoutKind = "dismissed" | "failed" | "config" | "sdk";

export class RazorpayCheckoutError extends Error {
  readonly kind: RazorpayCheckoutKind;
  readonly razorpayError?: RazorpayError;

  constructor(kind: RazorpayCheckoutKind, message: string, razorpayError?: RazorpayError) {
    super(message);
    this.name = "RazorpayCheckoutError";
    this.kind = kind;
    this.razorpayError = razorpayError;
  }
}

export function isRazorpayCheckoutError(error: unknown): error is RazorpayCheckoutError {
  return error instanceof RazorpayCheckoutError;
}

export function razorpayKeyId(): string {
  const key = import.meta.env?.VITE_RAZORPAY_KEY_ID;
  if (!key) {
    throw new RazorpayCheckoutError("config", "Payment configuration error. Please contact support.");
  }
  return key;
}

export type OpenRazorpayCheckoutArgs = {
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: RazorpayPrefill;
  themeColor?: string;
  key?: string;
};

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function restoreCheckoutScroll(scrollY: number): void {
  document.body.style.overflow = "auto";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  window.scrollTo(0, scrollY);
}

export const openRazorpayCheckout = async (
  args: OpenRazorpayCheckoutArgs
): Promise<RazorpayOrderResponse> => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new RazorpayCheckoutError("sdk", "Razorpay SDK failed to load. Please check your internet connection.");
  }
  if (!window.Razorpay) {
    throw new RazorpayCheckoutError("sdk", "Razorpay SDK not loaded");
  }

  const key = args.key ?? razorpayKeyId();
  const scrollY = window.scrollY ?? 0;

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (action: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      restoreCheckoutScroll(scrollY);
      action();
    };

    const options: RazorpayOptions = {
      key,
      amount: args.amount,
      currency: args.currency,
      name: args.name,
      description: args.description,
      order_id: args.order_id,
      handler: (response: RazorpayOrderResponse) => {
        finish(() => resolve(response));
      },
      prefill: args.prefill ?? {},
      theme: {
        color: args.themeColor ?? "#9D57FF",
      },
      modal: {
        ondismiss: () => {
          finish(() => reject(new RazorpayCheckoutError("dismissed", "Payment cancelled by user")));
        },
        escape: true,
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", (error: RazorpayError) => {
      const description = error?.error?.description || "Payment failed. Please try again.";
      finish(() => reject(new RazorpayCheckoutError("failed", description, error)));
    });

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    razorpay.open();
  });
};
