import { callRazorpayCreateOrder, callRazorpayVerifyPayment, CurrencyType, Taxes } from "./cartService";
import { UserProfile } from "./authService";
import { useOrder } from "@/context/OrderContext";
import axiosInstance from "@/config/axionInstance";
import { store } from "@/module/store";
import { initializeUserAndCart } from "@/module/slice/CartSlice";

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayOrderResponse) => void;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
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
}

export type RazorpayError = {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
  };
}

// Define the Razorpay instance interface with event handling
interface RazorpayEvents {
  'payment.failed': (error: RazorpayError) => void;
  'modal.closed': () => void;
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

export const handleCheckout = (
  taxes: Taxes,
  totalValue: number,
  currency: CurrencyType,
  orderId: string,
  user: UserProfile
): Promise<RazorpayOrderResponse> => {
  return new Promise(async (resolve, reject) => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      return reject("Razorpay SDK failed to load");
    }

    try {
      const response = await callRazorpayCreateOrder({
        amount: totalValue,
        currency,
        receipt: orderId,
        notes: [],
        taxes,
      });

      const data = response.data;

      const options = {
        key: "rzp_test_KxxNVzRC1oX2C1",
        amount: data.amount * 100,
        currency: data.currency,
        name: "Kittyp Inc.",
        description: "Test Transaction",
        order_id: data.id,
        handler: async function (razorpayOrderResponse: RazorpayOrderResponse) {
          console.log("Payment successful", razorpayOrderResponse);

          try {
            const razorpayVerifyResponse = await callRazorpayVerifyPayment({
              orderId: razorpayOrderResponse.razorpay_order_id,
              paymentId: razorpayOrderResponse.razorpay_payment_id,
              signature: razorpayOrderResponse.razorpay_signature,
            });

            console.log("Verification response:", razorpayVerifyResponse);

            // If we get here, verification was successful
            resolve(razorpayOrderResponse);
          } catch (verifyError) {
            console.error("Verification failed:", verifyError);
            reject(new Error("Payment verification failed"));
          }
        },
        prefill: {
          name: user.firstName,
          email: user.email,
          contact: "",
        },
        theme: {
          color: "#9D57FF",
        },
        modal: {
          ondismiss: function() {
            reject(new Error("Payment cancelled by user"));
          },
          escape: true,
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (error: RazorpayError) => {
        console.error("Payment failed:", error);
        reject(error);
      });
      rzp.open();
    } catch (err) {
      console.error("Error in handleCheckout:", err);
      reject(err);
    }
  });
};

export const initializeRazorpay = (options: RazorpayOptions): Promise<RazorpayInstance> => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.Razorpay) {
        reject(new Error('Razorpay SDK not loaded'));
        return;
      }
      const razorpay = new window.Razorpay(options);
      resolve(razorpay);
    } catch (error) {
      reject(error);
    }
  });
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

export const handlePaymentTimeout = async (orderId: string): Promise<void> => {
  try {
    await axiosInstance.post(`/razorpay/handle-timeout/${orderId}`);
  } catch (error) {
    console.error('Error handling payment timeout:', error);
    throw error;
  }
};

export const handlePaymentCancellation = async (orderId: string): Promise<void> => {
  try {
    await axiosInstance.post(`/razorpay/handle-cancellation/${orderId}`);
    // Sync frontend cart state with backend after cancellation
    await store.dispatch(initializeUserAndCart());
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
    throw error;
  }
};

export const handlePayment = async (options: RazorpayOptions): Promise<RazorpayOrderResponse> => {
  return new Promise(async (resolve, reject) => {
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const razorpay = new window.Razorpay(options);
      
      // Handle payment failure
      razorpay.on('payment.failed', (error: RazorpayError) => {
        document.body.style.overflow = 'auto'; // Restore scroll
        if (options.order_id) {
          handlePaymentCancellation(options.order_id)
            .catch(err => console.error('Error handling payment cancellation:', err));
        }
        reject(error);
      });

      // Handle modal close
      razorpay.on('modal.closed', () => {
        document.body.style.overflow = 'auto'; // Restore scroll
        if (options.order_id) {
          handlePaymentCancellation(options.order_id)
            .catch(err => console.error('Error handling payment cancellation:', err));
        }
      });

      // Store original scroll position and disable scroll
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      razorpay.open();

      // Cleanup function to restore scroll state
      const cleanup = () => {
        document.body.style.overflow = 'auto';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };

      // Add cleanup to window object for external access if needed
      (window as any).__razorpayCleanup = cleanup;

    } catch (err) {
      // Ensure scroll is restored even on error
      document.body.style.overflow = 'auto';
      reject(err);
    }
  });
};
