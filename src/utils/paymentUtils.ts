import { toast } from "sonner";
import { handleCheckout, isRazorpayCheckoutError } from "@/services/paymentService";
import { CurrencyType, callRazorpayVerifyPayment } from "@/services/cartService";
import { UserProfile } from "@/services/authService";

interface Order {
    orderNumber: string;
    totalAmount: number;
    taxes: any;
    currency: string;
}

interface ReinitiatePaymentOptions {
    order: Order;
    user: UserProfile;
    onSuccess?: () => void;
    onVerifying?: () => void;
    onComplete?: () => void;
}

export const reinitiatePayment = async ({
    order,
    user,
    onSuccess,
    onVerifying,
    onComplete
}: ReinitiatePaymentOptions) => {
    if (!user) {
        toast.error("Please login to reinitiate payment");
        return;
    }

    try {
        const currency = order.currency === 'INR' ? CurrencyType.INR : CurrencyType.USD;

        const response = await handleCheckout(
            order.taxes,
            order.totalAmount,
            currency,
            order.orderNumber,
            user
        );

        if (onVerifying) {
            onVerifying();
        }

        const verifyResponse = await callRazorpayVerifyPayment({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
        });

        if (verifyResponse.success) {
            toast.success("Payment successful!");
            if (onSuccess) {
                onSuccess();
            }
        } else {
            throw new Error("Payment verification failed");
        }
    } catch (error: unknown) {
        if (isRazorpayCheckoutError(error) && error.kind === "dismissed") {
            toast.error("Payment was cancelled");
        } else if (isRazorpayCheckoutError(error) && error.kind === "failed") {
            toast.error(error.message);
        } else if (error instanceof Error && error.message === "Payment verification failed") {
            toast.error("Payment verification failed. Please contact support if payment was deducted.");
        } else {
            toast.error("Payment failed. Please try again.");
        }
        throw error;
    } finally {
        if (onComplete) {
            onComplete();
        }
    }
};
