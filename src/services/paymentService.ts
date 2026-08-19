import { callRazorpayCreateOrder, CurrencyType, Taxes } from "./cartService";
import { UserProfile } from "./authService";
import axiosInstance from "@/config/axionInstance";
import { store } from "@/module/store/store";
import { initializeUserAndCart } from "@/module/slice/CartSlice";
import {
  openRazorpayCheckout,
  type RazorpayOrderResponse,
} from "./razorpayCheckout";

export {
  loadRazorpayScript,
  openRazorpayCheckout,
  razorpayKeyId,
  isRazorpayCheckoutError,
  RazorpayCheckoutError,
  restoreCheckoutScroll,
} from "./razorpayCheckout";
export type {
  RazorpayOptions,
  RazorpayOrderResponse,
  RazorpayError,
  RazorpayInstance,
  RazorpayPrefill,
  OpenRazorpayCheckoutArgs,
} from "./razorpayCheckout";

export const handleCheckout = (
  taxes: Taxes,
  totalValue: number,
  currency: CurrencyType,
  orderId: string,
  user: UserProfile
): Promise<RazorpayOrderResponse> => {
  return (async () => {
    const response = await callRazorpayCreateOrder({
      amount: totalValue,
      currency,
      receipt: orderId,
      notes: [],
      taxes,
    });
    const data = response.data;
    return openRazorpayCheckout({
      amount: data.amount,
      currency: data.currency,
      name: "Kittyp Inc.",
      description: "Order payment",
      order_id: data.id,
      prefill: {
        name: user.firstName,
        email: user.email,
        contact: "",
      },
    });
  })();
};

export const handlePaymentTimeout = async (orderId: string): Promise<void> => {
  await axiosInstance.post(`/razorpay/handle-timeout/${orderId}`);
};

export const handlePaymentCancellation = async (orderId: string): Promise<void> => {
  await axiosInstance.post(`/razorpay/handle-cancellation/${orderId}`);
  await store.dispatch(initializeUserAndCart());
};
